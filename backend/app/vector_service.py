import os
import hashlib
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional, Tuple
from openai import OpenAI
import logging
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

logger = logging.getLogger(__name__)


class VectorService:
    """向量数据库服务，用于README内容的语义搜索"""
    
    def __init__(self):
        # 初始化ChromaDB客户端
        self.chroma_client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # 获取或创建集合
        self.collection = self.chroma_client.get_or_create_collection(
            name="repo_readmes",
            metadata={"hnsw:space": "cosine"}
        )
        
        # 选择 embedding 方法
        self.embedding_method = os.getenv("EMBEDDING_METHOD", "sentence_transformers")
        
        if self.embedding_method == "deepseek":
            # 初始化DeepSeek客户端
            self.deepseek_client = OpenAI(
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                base_url="https://api.deepseek.com"
            )
        elif self.embedding_method == "sentence_transformers":
            # 初始化Sentence Transformers模型
            model_name = os.getenv("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2")
            logger.info(f"加载 Sentence Transformer 模型: {model_name}")
            self.sentence_model = SentenceTransformer(model_name)
        elif self.embedding_method == "openai":
            # 初始化OpenAI客户端
            self.openai_client = OpenAI(
                api_key=os.getenv("OPENAI_API_KEY")
            )
        
    def get_embedding(self, text: str) -> List[float]:
        """获取文本向量"""
        try:
            if self.embedding_method == "deepseek":
                return self._get_deepseek_embedding(text)
            elif self.embedding_method == "sentence_transformers":
                return self._get_sentence_transformer_embedding(text)
            elif self.embedding_method == "openai":
                return self._get_openai_embedding(text)
            else:
                raise ValueError(f"不支持的 embedding 方法: {self.embedding_method}")
        except Exception as e:
            logger.error(f"获取向量失败: {e}")
            raise
    
    def _get_deepseek_embedding(self, text: str) -> List[float]:
        """使用DeepSeek API获取文本向量"""
        response = self.deepseek_client.embeddings.create(
            model="deepseek-embedding",
            input=text,
            encoding_format="float"
        )
        return response.data[0].embedding
    
    def _get_sentence_transformer_embedding(self, text: str) -> List[float]:
        """使用Sentence Transformers获取文本向量"""
        embedding = self.sentence_model.encode(text, convert_to_tensor=False)
        return embedding.tolist()
    
    def _get_openai_embedding(self, text: str) -> List[float]:
        """使用OpenAI API获取文本向量"""
        response = self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
            encoding_format="float"
        )
        return response.data[0].embedding
    
    def add_readme(self, repo_id: int, content: str, metadata: Dict = None) -> str:
        """添加README内容到向量数据库"""
        try:
            # 生成唯一ID
            embedding_id = f"repo_{repo_id}"
            
            # 获取文本向量
            embedding = self.get_embedding(content)
            
            # 准备元数据
            doc_metadata = {
                "repo_id": repo_id,
                "content_length": len(content),
                **(metadata or {})
            }
            
            # 添加到向量数据库
            self.collection.add(
                ids=[embedding_id],
                embeddings=[embedding],
                documents=[content],
                metadatas=[doc_metadata]
            )
            
            logger.info(f"成功添加仓库 {repo_id} 的README到向量数据库")
            return embedding_id
            
        except Exception as e:
            logger.error(f"添加README到向量数据库失败: {e}")
            raise
    
    def update_readme(self, repo_id: int, content: str, metadata: Dict = None) -> str:
        """更新README内容"""
        try:
            embedding_id = f"repo_{repo_id}"
            
            # 先删除旧的记录
            try:
                self.collection.delete(ids=[embedding_id])
            except Exception:
                pass  # 如果不存在就忽略
            
            # 添加新的记录
            return self.add_readme(repo_id, content, metadata)
            
        except Exception as e:
            logger.error(f"更新README向量失败: {e}")
            raise
    
    def delete_readme(self, repo_id: int):
        """删除README向量"""
        try:
            embedding_id = f"repo_{repo_id}"
            self.collection.delete(ids=[embedding_id])
            logger.info(f"成功删除仓库 {repo_id} 的README向量")
        except Exception as e:
            logger.error(f"删除README向量失败: {e}")
            raise
    
    def semantic_search(self, query: str, limit: int = 10) -> List[Dict]:
        """语义搜索README内容"""
        try:
            # 获取查询向量
            query_embedding = self.get_embedding(query)
            
            # 执行向量搜索
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                include=["documents", "metadatas", "distances"]
            )
            
            # 格式化结果
            search_results = []
            if results["ids"] and results["ids"][0]:
                for i in range(len(results["ids"][0])):
                    result = {
                        "repo_id": results["metadatas"][0][i]["repo_id"],
                        "content": results["documents"][0][i],
                        "similarity_score": 1 - results["distances"][0][i],  # 转换为相似度分数
                        "metadata": results["metadatas"][0][i]
                    }
                    search_results.append(result)
            
            return search_results
            
        except Exception as e:
            logger.error(f"语义搜索失败: {e}")
            raise
    
    def get_collection_stats(self) -> Dict:
        """获取向量数据库统计信息"""
        try:
            count = self.collection.count()
            return {
                "total_documents": count,
                "collection_name": self.collection.name
            }
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {"total_documents": 0, "collection_name": "repo_readmes"}
    
    def clear_collection(self):
        """清空向量数据库"""
        try:
            # 删除现有集合
            self.chroma_client.delete_collection("repo_readmes")
            # 重新创建集合
            self.collection = self.chroma_client.get_or_create_collection(
                name="repo_readmes",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("成功清空向量数据库")
        except Exception as e:
            logger.error(f"清空向量数据库失败: {e}")
            raise


# 全局向量服务实例
vector_service = VectorService()


def get_content_hash(content: str) -> str:
    """计算内容哈希值"""
    return hashlib.md5(content.encode('utf-8')).hexdigest() 