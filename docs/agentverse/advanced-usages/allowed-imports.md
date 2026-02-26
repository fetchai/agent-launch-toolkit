# Support for Agents Code - Allowed Imports

> Source: https://docs.agentverse.ai/documentation/advanced-usages/allowed-imports

## Overview

When coding agents on Agentverse, development occurs through the Agent Editor. This platform provides various imports and libraries for creating agent applications.

Key points about the Agent class:
- The `Agent` class is a wrapper for a pre-loaded `agent` instance
- Custom configurations are ignored since hosted agents have preset settings
- The `agent.run()` method is supported to unify local and hosted code
- Use of `Bureau` is not allowed as each Agent project can contain only a single Agent

## Available Frameworks and Libraries

### uagents
Framework for building decentralized applications. Classes: `Model`, `Context`, `Protocol`.

### requests
HTTP interaction package: `get`, `post`, `put`, `patch`, `delete`.

### cosmpy
Library for interacting with Cosmos-based blockchains.

### pydantic
Data validation and settings management.

### pymongo
MongoDB database interaction.

### bs4 (BeautifulSoup)
HTML and XML parsing for web scraping.

### fetchai-babble
Fetch.ai messaging service interaction.

### langchain-anthropic
LangChain integration for Anthropic's generative models.

### langchain-community
Third-party LangChain integrations.

### langchain-core
Base abstractions powering the LangChain ecosystem.

### langchain-google-genai
LangChain integrations for Gemini models.

### langchain-google-vertexai
LangChain integrations for Google Cloud generative models.

### langchain-openai
LangChain integrations for OpenAI through their SDK.

### langchain-text-splitters
Utilities for splitting text documents into chunks.

### langchain
Comprehensive framework for LLM-integrated applications.

### nltk
Natural language processing package.

### openai
Easy access to OpenAI REST API with type definitions and sync/async clients.

### tenacity
General-purpose retrying library.

### unstructured
Data extraction from unstructured formats (PDFs, Word documents, etc.).

### validators
Data validation library.

### web3
Python library for Ethereum blockchain interaction.

### anthropic
Python SDK for interacting with Anthropic's AI models including Claude.

### mcp
Model Context Protocol for connecting AI models with external data sources.

### httpx
Full-featured HTTP client supporting HTTP/1.1, HTTP/2, with async capabilities.

### asyncpg
Asynchronous PostgreSQL client.

### faiss-cpu
Efficient similarity search and vector clustering.

### google-genai
Google's client for accessing Gemini models.

### huggingface-hub
Utilities for downloading and uploading models, datasets, and spaces.

### langgraph
Framework for stateful, graph-based workflows around LLMs.

### pypdf
Pure-Python library for reading, manipulating, and writing PDFs.

## Additional Supported Packages (150+)

- **Core frameworks**: uagents-core, agentverse-client
- **Async utilities**: aiofiles, aiohttp, aiohttp-retry, aiosignal, anyio
- **Data handling**: annotated-types, attrs, dataclasses-json, marshmallow
- **Cryptography**: cryptography, coincurve, ecdsa, eciespy, eth-abi, eth-account, eth-keys, py-ecc, pycryptodome, rsa
- **Web/HTTP**: aiohttp, httpcore, httpx-sse, requests-toolbelt, urllib3, websockets
- **Database**: asyncpg, SQLAlchemy
- **Data processing**: numpy, pyarrow, pandas, scipy
- **Compression**: zstandard
- **Blockchain**: bech32, hexbytes, rlp, eth-typing, eth-utils, eth-keyfile, eth-rlp, eth-hash
- **Google Cloud**: google-cloud-aiplatform, google-cloud-bigquery, google-cloud-storage
- **Utilities**: click, filelock, joblib, packaging, psutil, tqdm, virtualenv
