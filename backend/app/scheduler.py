import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from sqlalchemy.orm import Session

from .database import SessionLocal
from .readme_service import readme_service
from .websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


class TaskScheduler:
    """定时任务调度器"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.readme_processing_status = {
            "is_processing": False,
            "last_run": None,
            "next_run": None,
            "total_processed": 0,
            "message": "Ready to process"
        }
    
    async def start(self):
        """启动调度器"""
        if not self.is_running:
            # 添加README处理任务 - 每天凌晨2点执行
            self.scheduler.add_job(
                self.process_readmes_job,
                CronTrigger(hour=2, minute=0),
                id="readme_processing",
                name="Process README files",
                replace_existing=True
            )
            
            # 添加增量README处理任务 - 每6小时执行一次
            self.scheduler.add_job(
                self.incremental_readme_job,
                IntervalTrigger(hours=6),
                id="incremental_readme",
                name="Incremental README processing",
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            logger.info("定时任务调度器已启动")
            
            # 更新下次运行时间
            self._update_next_run_time()
    
    async def stop(self):
        """停止调度器"""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("定时任务调度器已停止")
    
    def _update_next_run_time(self):
        """更新下次运行时间"""
        try:
            job = self.scheduler.get_job("readme_processing")
            if job and job.next_run_time:
                self.readme_processing_status["next_run"] = job.next_run_time
        except Exception as e:
            logger.error(f"更新下次运行时间失败: {e}")
    
    async def process_readmes_job(self):
        """README处理定时任务"""
        if self.readme_processing_status["is_processing"]:
            logger.warning("README处理任务已在运行中，跳过本次执行")
            return
        
        try:
            self.readme_processing_status["is_processing"] = True
            self.readme_processing_status["message"] = "开始处理README文件..."
            self.readme_processing_status["last_run"] = datetime.utcnow()
            
            # 广播状态更新
            await websocket_manager.broadcast_readme_status(self.readme_processing_status)
            
            logger.info("开始执行README处理定时任务")
            
            # 创建数据库会话
            db = SessionLocal()
            try:
                # 批量处理README
                result = await readme_service.batch_process_readmes(
                    db=db,
                    batch_size=5,  # 减少并发数以避免API限制
                    max_repos=None  # 处理所有仓库
                )
                
                self.readme_processing_status["total_processed"] = result["success"]
                self.readme_processing_status["message"] = f"处理完成：成功 {result['success']} 个，失败 {result['failed']} 个"
                
                logger.info(f"README处理任务完成：{result}")
                
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"README处理任务失败: {e}")
            self.readme_processing_status["message"] = f"处理失败: {str(e)}"
        
        finally:
            self.readme_processing_status["is_processing"] = False
            self._update_next_run_time()
            
            # 广播最终状态
            await websocket_manager.broadcast_readme_status(self.readme_processing_status)
    
    async def incremental_readme_job(self):
        """增量README处理任务（处理最近更新的仓库）"""
        if self.readme_processing_status["is_processing"]:
            logger.warning("README处理任务已在运行中，跳过增量处理")
            return
        
        try:
            logger.info("开始执行增量README处理任务")
            
            # 创建数据库会话
            db = SessionLocal()
            try:
                # 只处理最近50个仓库
                result = await readme_service.batch_process_readmes(
                    db=db,
                    batch_size=5,
                    max_repos=50
                )
                
                logger.info(f"增量README处理完成：{result}")
                
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"增量README处理失败: {e}")
    
    async def manual_process_readmes(self, max_repos: int = None):
        """手动触发README处理"""
        if self.readme_processing_status["is_processing"]:
            raise Exception("README处理任务已在运行中")
        
        try:
            self.readme_processing_status["is_processing"] = True
            self.readme_processing_status["message"] = "手动处理README文件..."
            self.readme_processing_status["last_run"] = datetime.utcnow()
            
            # 广播状态更新
            await websocket_manager.broadcast_readme_status(self.readme_processing_status)
            
            # 创建数据库会话
            db = SessionLocal()
            try:
                result = await readme_service.batch_process_readmes(
                    db=db,
                    batch_size=5,
                    max_repos=max_repos
                )
                
                self.readme_processing_status["total_processed"] = result["success"]
                self.readme_processing_status["message"] = f"手动处理完成：成功 {result['success']} 个，失败 {result['failed']} 个"
                
                return result
                
            finally:
                db.close()
        
        finally:
            self.readme_processing_status["is_processing"] = False
            await websocket_manager.broadcast_readme_status(self.readme_processing_status)
    
    def get_status(self):
        """获取调度器状态"""
        return {
            "is_running": self.is_running,
            "readme_processing": self.readme_processing_status,
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time,
                    "trigger": str(job.trigger)
                }
                for job in self.scheduler.get_jobs()
            ] if self.is_running else []
        }


# 全局调度器实例
task_scheduler = TaskScheduler() 