#!/usr/bin/env python3
"""
知识库更新调度器
实现定时自动更新和监控文件变更
"""

import os
import time
import json
import schedule
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from incremental_update import IncrementalUpdater

class KnowledgeBaseWatcher(FileSystemEventHandler):
    """知识库文件监控器"""
    
    def __init__(self, updater: IncrementalUpdater, debounce_seconds: int = 30):
        self.updater = updater
        self.debounce_seconds = debounce_seconds
        self.pending_updates = set()
        self.last_update_time = None
        self.update_timer = None
        
        # 支持的文件扩展名
        self.supported_extensions = {'.md', '.pdf', '.docx', '.doc'}
    
    def is_supported_file(self, file_path: str) -> bool:
        """检查是否为支持的文件类型"""
        return Path(file_path).suffix.lower() in self.supported_extensions
    
    def on_modified(self, event):
        """文件修改事件"""
        if not event.is_directory and self.is_supported_file(event.src_path):
            self.schedule_update(event.src_path, 'modified')
    
    def on_created(self, event):
        """文件创建事件"""
        if not event.is_directory and self.is_supported_file(event.src_path):
            self.schedule_update(event.src_path, 'created')
    
    def on_deleted(self, event):
        """文件删除事件"""
        if not event.is_directory and self.is_supported_file(event.src_path):
            self.schedule_update(event.src_path, 'deleted')
    
    def on_moved(self, event):
        """文件移动事件"""
        if not event.is_directory:
            if self.is_supported_file(event.src_path):
                self.schedule_update(event.src_path, 'deleted')
            if self.is_supported_file(event.dest_path):
                self.schedule_update(event.dest_path, 'created')
    
    def schedule_update(self, file_path: str, event_type: str):
        """调度更新"""
        rel_path = os.path.relpath(file_path, self.updater.knowledge_base_path)
        self.pending_updates.add((rel_path, event_type))
        
        print(f"检测到文件变更: {rel_path} ({event_type})")
        
        # 取消之前的定时器
        if self.update_timer:
            self.update_timer.cancel()
        
        # 设置新的定时器（防抖动）
        self.update_timer = threading.Timer(self.debounce_seconds, self.execute_update)
        self.update_timer.start()
    
    def execute_update(self):
        """执行更新"""
        if not self.pending_updates:
            return
        
        print(f"\n执行增量更新，处理 {len(self.pending_updates)} 个变更...")
        
        try:
            result = self.updater.incremental_update()
            
            if result['status'] == 'success':
                print(f"✅ 自动更新成功! 耗时 {result['duration']:.2f} 秒")
                print(f"   变更统计: +{result['changes']['added']} ~{result['changes']['modified']} -{result['changes']['deleted']}")
            else:
                print(f"ℹ️ 更新状态: {result['status']}")
            
            self.last_update_time = datetime.now()
            
        except Exception as e:
            print(f"❌ 自动更新失败: {e}")
        
        finally:
            self.pending_updates.clear()
            self.update_timer = None

class UpdateScheduler:
    """更新调度器"""
    
    def __init__(self, config_path: str = None):
        self.updater = IncrementalUpdater()
        self.config = self.load_config(config_path)
        self.watcher = None
        self.observer = None
        self.is_running = False
        
        # 统计信息
        self.stats = {
            'scheduled_updates': 0,
            'file_watch_updates': 0,
            'manual_updates': 0,
            'last_scheduled_update': None,
            'last_file_watch_update': None
        }
    
    def load_config(self, config_path: str = None) -> Dict:
        """加载配置"""
        default_config = {
            'scheduled_update': {
                'enabled': True,
                'interval_hours': 6,
                'time': '02:00'  # 每天凌晨2点
            },
            'file_watch': {
                'enabled': True,
                'debounce_seconds': 30
            },
            'logging': {
                'enabled': True,
                'log_file': 'update_scheduler.log'
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                    default_config.update(user_config)
            except Exception as e:
                print(f"加载配置文件失败: {e}，使用默认配置")
        
        return default_config
    
    def setup_scheduled_updates(self):
        """设置定时更新"""
        if not self.config['scheduled_update']['enabled']:
            return
        
        interval_hours = self.config['scheduled_update']['interval_hours']
        update_time = self.config['scheduled_update']['time']
        
        if interval_hours > 0:
            # 按间隔时间更新
            schedule.every(interval_hours).hours.do(self.run_scheduled_update)
            print(f"设置定时更新: 每 {interval_hours} 小时")
        
        if update_time:
            # 按指定时间更新
            schedule.every().day.at(update_time).do(self.run_scheduled_update)
            print(f"设置定时更新: 每天 {update_time}")
    
    def setup_file_watcher(self):
        """设置文件监控"""
        if not self.config['file_watch']['enabled']:
            return
        
        debounce_seconds = self.config['file_watch']['debounce_seconds']
        self.watcher = KnowledgeBaseWatcher(self.updater, debounce_seconds)
        
        self.observer = Observer()
        self.observer.schedule(
            self.watcher, 
            self.updater.knowledge_base_path, 
            recursive=True
        )
        
        print(f"设置文件监控: {self.updater.knowledge_base_path} (防抖动 {debounce_seconds}s)")
    
    def run_scheduled_update(self):
        """运行定时更新"""
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 执行定时更新...")
        
        try:
            result = self.updater.incremental_update()
            
            self.stats['scheduled_updates'] += 1
            self.stats['last_scheduled_update'] = datetime.now().isoformat()
            
            if result['status'] == 'success':
                print(f"✅ 定时更新成功! 耗时 {result['duration']:.2f} 秒")
                print(f"   变更统计: +{result['changes']['added']} ~{result['changes']['modified']} -{result['changes']['deleted']}")
            elif result['status'] == 'no_changes':
                print("ℹ️ 知识库已是最新状态")
            
        except Exception as e:
            print(f"❌ 定时更新失败: {e}")
    
    def start(self):
        """启动调度器"""
        if self.is_running:
            print("调度器已在运行中")
            return
        
        print("启动知识库更新调度器...")
        
        # 设置定时更新
        self.setup_scheduled_updates()
        
        # 设置文件监控
        self.setup_file_watcher()
        
        # 启动文件监控
        if self.observer:
            self.observer.start()
            print("文件监控已启动")
        
        self.is_running = True
        print("调度器启动完成\n")
        
        try:
            while self.is_running:
                # 运行定时任务
                schedule.run_pending()
                time.sleep(1)
        
        except KeyboardInterrupt:
            print("\n收到中断信号，正在停止调度器...")
        
        finally:
            self.stop()
    
    def stop(self):
        """停止调度器"""
        if not self.is_running:
            return
        
        print("停止调度器...")
        
        self.is_running = False
        
        # 停止文件监控
        if self.observer:
            self.observer.stop()
            self.observer.join()
            print("文件监控已停止")
        
        # 取消定时任务
        schedule.clear()
        print("定时任务已清除")
        
        # 打印统计信息
        self.print_stats()
    
    def print_stats(self):
        """打印统计信息"""
        print("\n=== 调度器统计信息 ===")
        print(f"定时更新次数: {self.stats['scheduled_updates']}")
        print(f"文件监控更新次数: {self.stats['file_watch_updates']}")
        print(f"手动更新次数: {self.stats['manual_updates']}")
        
        if self.stats['last_scheduled_update']:
            print(f"最后定时更新: {self.stats['last_scheduled_update']}")
        
        if self.stats['last_file_watch_update']:
            print(f"最后文件监控更新: {self.stats['last_file_watch_update']}")
    
    def manual_update(self, force_rebuild: bool = False):
        """手动更新"""
        print("执行手动更新...")
        
        try:
            result = self.updater.incremental_update(force_rebuild=force_rebuild)
            
            self.stats['manual_updates'] += 1
            
            if result['status'] == 'success':
                print(f"✅ 手动更新成功! 耗时 {result['duration']:.2f} 秒")
                print(f"   变更统计: +{result['changes']['added']} ~{result['changes']['modified']} -{result['changes']['deleted']}")
            elif result['status'] == 'no_changes':
                print("ℹ️ 知识库已是最新状态")
            
            return result
            
        except Exception as e:
            print(f"❌ 手动更新失败: {e}")
            return {'status': 'error', 'error': str(e)}

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='知识库更新调度器')
    parser.add_argument('--config', help='配置文件路径')
    parser.add_argument('--manual', action='store_true', help='执行手动更新后退出')
    parser.add_argument('--force-rebuild', action='store_true', help='强制重建向量存储')
    parser.add_argument('--daemon', action='store_true', help='以守护进程模式运行')
    
    args = parser.parse_args()
    
    scheduler = UpdateScheduler(args.config)
    
    if args.manual:
        # 手动更新模式
        result = scheduler.manual_update(force_rebuild=args.force_rebuild)
        return 0 if result['status'] in ['success', 'no_changes'] else 1
    
    else:
        # 调度器模式
        try:
            scheduler.start()
        except Exception as e:
            print(f"调度器运行失败: {e}")
            return 1
    
    return 0

if __name__ == "__main__":
    exit(main())