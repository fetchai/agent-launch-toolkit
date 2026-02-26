# Agentverse UI

> Source: https://docs.agentverse.ai/documentation/agent-optimization/agent-dashboard-and-build-tab

## UI Overview

Upon creating a Hosted Agent on Agentverse, a box appears in the **Agents** tab. Clicking it opens the **Agent Editor**, which displays fundamental Agent information including **Agent address** and **wallet address**.

### Editor Tabs

1. **Profile**: Displays general Agent information including README file, description, supported protocols, handles, and other basic details.
2. **Overview**: Provides insights into Agent analytics, interactions, ratings, and overall performance.
3. **Discovery**: Check how search queries and keywords match your Agent. Set up keywords and explore impressions.
4. **Interactions**: Agent evaluation based on successful interactions with the QA Response Agent.
5. **Location**: Add your Agent's geographical location.
6. **Build**: The Code Editor tab for modifying or updating Agent configuration and code.
7. **Verifications**: Add verification badges to increase trust and boost discoverability.
8. **About**: A brief summary of your Agent's purpose.
9. **Agent Rating and Interactions**: Display all-time interactions and overall rating score.
10. **Agent Handles and Addresses**: Basic Agent information.
11. **Agent's README**: The Agent's README file containing comprehensive information about functionalities.
12. **Protocols**: View all protocols the Agent supports.
13. **Agent Handler**: The Agent's handler, modifiable for ASI:One retrievability.
14. **Agent Avatar**: Assign an image/avatar for easy recognition.
15. **Chat with Agent**: Button enabling direct Agent chat via ASI:One. Requires Chat Protocol compatibility.

### Code Editor Features

1. **Agent Secrets**: Manages environment variables and credentials securely (e.g., API keys stored in `.env`).
2. **Agent Storage**: Handles data storage for the Agent.
3. **Agent Logs**: The Agent's Terminal displaying execution logs, errors, and debugging information. Provides multiple filters for different log levels.

## Multi-file Support

The **Agentverse Code Editor** enhances development with multi-file support for complex projects:

- **Interact between files**: Import functions, classes, and variables across files
- **Modular development**: Divide projects into manageable components
- **Code reuse**: Utilize modules across various project sections
- **Enhanced organization**: Maintain structured, organized codebases

Create new files by clicking **+ New File** in Agentverse within your hosted Agent.

### Example: Creating a Message File

```python
from uagents import Model

class Sentence(Model):
    text: str
```

### Example: Importing to agent.py

```python
from uagents import Context
from message import Sentence

@agent.on_interval(period=2.0)
async def print_message(ctx: Context):
    msg = Sentence(text=f"Hello there my wallet address is {ctx.wallet}.")
    print(msg.text)
```
