# Original User Request

## Initial Request — 2026-07-08T09:00:29Z

# Teamwork Project Prompt — Draft

Implement four major features for the AI Chat application: Retrieval-Augmented Generation (RAG) using the existing ChromaDB setup, Real-time Web Search capability within the chat loop, a Conversation History Sidebar to manage past threads, and Speech-to-Text Voice Mode for audio input.

Working directory: ~/DevSpace/Project name
Integrity mode: development

## Requirements

### R1. RAG / Document Chat Integration
Connect the existing ChromaDB `documents` app to the chat loop in `consumers.py`. The AI must be able to retrieve and use private uploaded documents to answer user queries.

### R2. Real-time Web Search Capability
Implement a free web scraping/search integration (e.g., DuckDuckGo or basic scraping) in the backend that the AI can use to fetch live data without needing paid API keys.

### R3. Conversation History Sidebar
Build a UI sidebar in the frontend to display past chats, backed by the Postgres database models. It should allow the user to switch between and load past conversation threads.

### R4. Speech-to-Text Voice Mode
Add a microphone button to the Chat input using the browser's native `SpeechRecognition` API (or `webkitSpeechRecognition`).

## Verification Resources
You can use the existing Docker setup (`docker-compose up`) to test the backend and frontend.

## Acceptance Criteria

### RAG Integration
- [ ] When a text file is uploaded containing a unique phrase (e.g., "The secret codeword is ALBATROSS"), the AI successfully answers "What is the secret codeword?" with the exact phrase.

### Web Search
- [ ] The AI successfully answers a question about an event that occurred today by fetching real-time data.

### Conversation History
- [ ] After refreshing the browser, past conversations appear in a sidebar and can be clicked to reload the full chat history.

### Voice Mode
- [ ] Clicking the microphone button captures audio and populates the chat input field with text (can be tested manually or by mocking the SpeechRecognition API).

## Follow-up — 2026-07-12T22:56:23Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Teamwork swarm is now executing the prompt.

Implement the backend orchestration loop and WebSocket integration for the Skilled Eagle Agent (SEA) based on the provided 16-page EAGLE system prompt, and wire it up to the existing React/Next.js frontend UI components.

Working directory: /Users/kibobodjona/DevSpace/Project name
Integrity mode: benchmark

## Requirements

### R1. Backend Orchestration & Tools
Implement the `apps.agent` Django app featuring the SEA autonomous orchestration loop, local tool execution (filesystem, shell), and the `SEAConsumer` mapped to `/ws/sea/`. The agent team may decide the safest way to execute shell commands.

### R2. System Prompt Integration
Integrate the 16-page EAGLE system prompt as the core persona and operational rules engine for the LLM powering the SEA orchestration loop. 

### R3. Frontend Wiring
Update the existing SEA React components (`AgentChat.tsx`, `AgentTerminal.tsx`) to connect to `/ws/sea/` and render real-time tool execution logs, thoughts, and outputs.

## Acceptance Criteria

### Backend Connectivity
- [ ] A test script can successfully connect to the `ws://localhost:8000/ws/sea/` WebSocket endpoint.

### Tool Execution
- [ ] When a specific prompt requiring a file read is sent via the WebSocket, the backend successfully triggers the `read_file` tool locally and returns the file contents in the WebSocket response.

### UI Synchronization 
- [ ] The `AgentTerminal.tsx` component correctly displays simulated or real terminal logs when the backend executes a shell command via the agent loop.

