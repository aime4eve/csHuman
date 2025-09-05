import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from hkt_agent_framework.LLM.SiliconCloud import SiliconCloud,Message
# from hkt_agent_framework.message import Message


# from openai import OpenAI
# client = OpenAI(
#     api_key="sk-oggtqfkngvjnveqljbymxtjqzsndlxhwugtcvqzmpsurszny", # 从https://cloud.siliconflow.cn/account/ak获取
#     base_url="https://api.siliconflow.cn/v1"
# )
 
# def chat_model(word):    

#     qwen2_5_72B_fine_tuned_messages = [
#         {
#             "role": "system", 
#             "content": "你是客服数字人"
#         },
#         {
#             "role": "user", 
#             "content": f"{word}"
#         }
#     ]

#     # 使用基于Qwen2.5-72B-Instruct+智说新语语料微调后的模型
#     qwen2_5_72B_fine_tuned_response = client.chat.completions.create(
#         # 模型名称，从 https://cloud.siliconflow.cn/fine-tune 获取对应的微调任务
#         model="ft:LoRA/Qwen/Qwen2.5-72B-Instruct:kafko88k4e:hkt_szr:npwivjtfynnfhuzijmzb", 
#         messages=qwen2_5_72B_fine_tuned_messages,
#         stream=True,
#         max_tokens=4096
#     )

#     print('\n\033[32m使用基于Qwen2.5-72B-Instruct+语料微调后的模型:\033[0m')
#     print(f"{word}：", end='')
#     for chunk in qwen2_5_72B_fine_tuned_response:
#         print(chunk.choices[0].delta.content, end='')
        
if __name__ == '__main__':
    sc = SiliconCloud(model="ft:LoRA/Qwen/Qwen2.5-72B-Instruct:kafko88k4e:hkt_szr:npwivjtfynnfhuzijmzb")
    system_msg = Message(role="system",content="你是客服数字人")
    words = ['安装外夹式超声波流量计需要停产吗？']

    for word in words:
    #     chat_model(word)
    #     print('\n')
        user_msg = Message(role="user",content="安装外夹式超声波流量计需要停产吗？")
        response = sc.chat([system_msg,user_msg])
        print(response)
        print('\n')

# -*- coding: utf-8 -*-
# 本文件用于 SiliconFlow 相关的单元测试示例
# 注意：请勿在仓库中提交任何真实密钥/令牌；以下示例中的密钥已脱敏处理。

# from siliconflow import SiliconClient

# 示例（已脱敏）：从 https://cloud.siliconflow.cn/account/ak 获取
# client = SiliconClient(
#     api_key="sk-REDACTED-PLACEHOLDER",  # 请使用环境变量或本地未跟踪配置文件加载
# )
