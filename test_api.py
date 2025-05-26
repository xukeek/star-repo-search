#!/usr/bin/env python3
"""
简单的API测试脚本
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_search_api():
    """测试搜索API的新功能"""
    print("🔍 测试搜索API...")
    
    # 测试基本搜索
    response = requests.get(f"{BASE_URL}/repos/search", params={
        "page": 1,
        "per_page": 5
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 基本搜索成功: 找到 {data['total']} 个仓库")
        print(f"   当前页: {data['page']}/{data['total_pages']}")
    else:
        print(f"❌ 基本搜索失败: {response.status_code}")
        return
    
    # 测试排序功能
    print("\n🔄 测试排序功能...")
    for sort_by in ['starred_at', 'stargazers_count', 'forks_count']:
        for sort_order in ['desc', 'asc']:
            response = requests.get(f"{BASE_URL}/repos/search", params={
                "sort_by": sort_by,
                "sort_order": sort_order,
                "per_page": 3
            })
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 排序 {sort_by} {sort_order}: {len(data['repos'])} 个结果")
            else:
                print(f"❌ 排序 {sort_by} {sort_order} 失败: {response.status_code}")
    
    # 测试时间范围搜索
    print("\n📅 测试时间范围搜索...")
    
    # 最近30天
    today = datetime.now()
    thirty_days_ago = today - timedelta(days=30)
    
    response = requests.get(f"{BASE_URL}/repos/search", params={
        "starred_after": thirty_days_ago.strftime('%Y-%m-%d'),
        "per_page": 5
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 最近30天搜索: 找到 {data['total']} 个仓库")
    else:
        print(f"❌ 时间范围搜索失败: {response.status_code}")
    
    # 测试分页
    print("\n📄 测试分页功能...")
    for page_size in [10, 20, 50]:
        response = requests.get(f"{BASE_URL}/repos/search", params={
            "per_page": page_size,
            "page": 1
        })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 每页 {page_size} 条: 实际返回 {len(data['repos'])} 条")
        else:
            print(f"❌ 分页测试失败: {response.status_code}")

def test_stats_api():
    """测试统计API"""
    print("\n📊 测试统计API...")
    
    response = requests.get(f"{BASE_URL}/stats")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 统计信息获取成功:")
        print(f"   总仓库数: {data['total_repos']}")
        print(f"   总Stars: {data['total_stars']}")
        print(f"   总Forks: {data['total_forks']}")
        print(f"   热门语言: {[lang['language'] for lang in data['top_languages'][:3]]}")
    else:
        print(f"❌ 统计信息获取失败: {response.status_code}")

def test_sync_status():
    """测试同步状态API"""
    print("\n🔄 测试同步状态API...")
    
    response = requests.get(f"{BASE_URL}/sync/status")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 同步状态获取成功:")
        print(f"   是否同步中: {data['is_syncing']}")
        print(f"   总仓库数: {data['total_repos']}")
        print(f"   状态消息: {data['message']}")
        if data.get('last_sync'):
            print(f"   上次同步: {data['last_sync']}")
    else:
        print(f"❌ 同步状态获取失败: {response.status_code}")

if __name__ == "__main__":
    print("🚀 开始API测试...\n")
    
    try:
        test_sync_status()
        test_stats_api()
        test_search_api()
        print("\n✅ 所有测试完成!")
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务器，请确保后端服务正在运行在 http://localhost:8000")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}") 