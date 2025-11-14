# Orchestrator/Agents Feature Specification

## Overview

This document outlines the comprehensive plan for implementing the Orchestrator/Agents feature in Agent Zero. This refactoring will shift terminology from "Agent Zero/Subordinates" to "Orchestrator/Agents" and introduce a formal agent definition and management system.

---

## 1. Terminology Refactoring

### Current Terminology → New Terminology Mapping

| Current | New | Location/Scope |
|---------|-----|----------------|
| "Agent Zero" | "Orchestrator" | Main agent in a chat session |
| "agent0" | "orchestrator" | Variable names, class attributes |
| "subordinate" | "agent" | Any agent spawned or managed by orchestrator |
| "superior" | "parent" | Reverse relationship (parent-child instead of superior-subordinate) |
| `Agent.DATA_NAME_SUBORDINATE` | `Agent.DATA_NAME_AGENT` | Internal data storage keys |
| `Agent.DATA_NAME_SUPERIOR` | `Agent.DATA_NAME_PARENT` | Internal data storage keys |

### Files Requiring Terminology Updates

**Python Core:** /agent.py, /initialize.py, /python/tools/call_subordinate.py, /prompts/agent.system.tool.call_sub.py
**Documentation:** /README.md, /docs/

---

## 2. Agent Definition Schema

### AgentDefinition Data Structure

```python
@dataclass
class AgentDefinition:
    id: str
    name: str
    description: str
    version: str = "1.0.0"
    created_at: datetime
    updated_at: datetime
    created_by: str = "system"
    
    system_prompt: str
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    
    tools_enabled: list[str] = field(default_factory=list)
    tools_disabled: list[str] = field(default_factory=list)
    extensions_enabled: list[str] = field(default_factory=list)
    
    allow_spawning_agents: bool = True
    allow_knowledge_access: bool = True
    allow_memory_access: bool = True
    isolation_level: str = "moderate"  # strict, moderate, permissive
    
    is_active: bool = True
    tags: list[str] = field(default_factory=list)
    custom_config: dict = field(default_factory=dict)
```

### Storage Structure

```
/agents/custom-agents/
├── [agent-id]/
│   ├── _definition.json
│   ├── _metadata.json
│   ├── system.md
│   └── _versions/
│       └── v{version}_{timestamp}.json
```

---

## 3. Chat-to-Agent Creation Flow

### User-Driven Agent Creation Process

1. **Intent Capture** - User describes desired agent in natural language
2. **Intent Analysis** - LLM extracts purpose, capabilities, tools, constraints
3. **Definition Generation** - LLM generates structured agent definition
4. **Validation & Refinement** - User reviews and modifies if needed
5. **Activation** - Agent is saved and becomes available for use

### Example Flow

```
User: "Create an agent that reviews code"
    ↓
System analyzes intent, extracts: {purpose, languages, tools needed}
    ↓
System generates: system_prompt, tools, model config
    ↓
System shows preview, user confirms or modifies
    ↓
Agent saved to /agents/custom-agents/code-reviewer/
    ↓
Agent available for spawning in chat
```

---

## 4. Backend Storage & Retrieval

### Flask API Endpoints (9 total)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agents/list` | GET | List all agents with filters |
| `/api/agents/{agent_id}` | GET | Get single agent definition |
| `/api/agents/create` | POST | Create new agent |
| `/api/agents/{agent_id}/update` | PUT | Update agent definition |
| `/api/agents/{agent_id}/delete` | DELETE | Delete agent |
| `/api/agents/{agent_id}/clone` | POST | Clone/copy agent |
| `/api/agents/test` | POST | Test agent definition |
| `/api/agents/{agent_id}/versions` | GET | List version history |
| `/api/agents/{agent_id}/rollback` | POST | Restore previous version |

### Persistence Strategy

- **File-based primary storage** (JSON files in `/agents/custom-agents/`)
- **Metadata tracking** (usage stats, last modified)
- **Version history** (timestamped snapshots)
- **Optional SQLite** for querying (future enhancement)

---

## 5. UI Agents Tab

### Tab Components

**Agents List View**
- Display all agents in table/card format
- Search and filter functionality
- Sort by name, date, usage
- Context menu per agent: edit, clone, delete, test, info

**Agent Details Panel**
- Show full agent definition
- Display tools, permissions, settings
- System prompt preview
- Usage statistics
- Version history

**Create Agent Wizard** (5 steps)
1. Basic Info (name, description, tags)
2. Functionality (tools, extensions)
3. Behavior (system prompt, temperature, model)
4. Permissions (isolation, access levels)
5. Review & Confirm

**Edit Agent Form**
- Modify any field
- Track version changes
- Option to create new version
- Save changes

---

## 6. Agent Instantiation Logic

### spawn_agent Tool Flow

1. Load agent definition from registry
2. Check orchestrator permissions
3. Create Agent instance from definition
4. Apply configuration (model, temp, tools)
5. Set system prompt from definition
6. Run agent's monologue with user message
7. Track usage statistics
8. Return result to orchestrator

### Configuration Priority

1. Runtime config_override (highest)
2. Agent definition settings
3. Parent agent settings
4. Global user settings
5. System defaults (lowest)

---

## 7. Architectural Decisions

### Isolation Levels

- **Strict** - No knowledge, memory, or sub-agent access
- **Moderate** (default) - Limited read access to knowledge/memory
- **Permissive** - Full access to all resources

### Model Selection

- Agents can override orchestrator's model
- Or inherit orchestrator's model (default)
- Per-agent model configuration for specialization

### Prompt Management

- Free-form system prompts (full flexibility)
- Optional templates for consistency
- Version control for all changes
- Automatic prompt validation

### Versioning

- Semantic versioning (1.0.0, 1.1.0, etc.)
- Timestamped file-based history
- One-click rollback to previous versions
- Change summaries optional

---

## 8. File Structure Changes

### Directory Organization (New)

```
/agents/
├── orchestrator/           (renamed from agent0)
│   ├── _definition.json   (NEW)
│   ├── _context.md
│   └── system.md
├── custom-agents/         (NEW)
│   ├── code-reviewer/
│   │   ├── _definition.json
│   │   └── _versions/
│   └── research-assistant/
│       └── ...
└── [other profiles]       (backward compatible)
```

### Python Files to Create

**Helpers:** agent_registry.py, agent_schema.py, agent_versioning.py, agent_instantiation.py
**API:** agents_list.py, agents_get.py, agents_create.py, agents_update.py, agents_delete.py, agents_clone.py, agents_test.py, agent_versions_list.py, agent_versions_rollback.py
**Tools:** spawn_agent.py (renamed from call_subordinate.py)

### UI Files to Create

**Components:** agents-list.html, agents-detail.html, agents-create.html, agents-edit.html, spawn-agent-modal.html
**Styles:** agents.css
**Scripts:** agents.js

---

## 9. Implementation Roadmap

### Phase 1: Terminology Refactoring (1-2 weeks)
- Update all Python core files
- Update prompts and system messages
- Update API endpoints
- Update UI/frontend
- Update documentation

### Phase 2: Agent Definition Schema (1 week)
- Create dataclasses and schema
- Implement file persistence
- Create validation system
- Add versioning support

### Phase 3: Chat-to-Agent Creation (1-2 weeks)
- Design LLM prompts
- Implement intent analysis
- Implement prompt generation
- Create UI wizard

### Phase 4: Backend Storage & Retrieval (1-2 weeks)
- Implement all 9 API endpoints
- Add permission checking
- Add error handling
- Implement versioning

### Phase 5: UI Agents Tab (1-2 weeks)
- Create agents list component
- Create details panel
- Create create/edit forms
- Add styling and responsive design

### Phase 6: Agent Instantiation (1 week)
- Update spawn_agent tool
- Implement configuration application
- Add permission enforcement
- Add usage tracking

### Phase 7: Testing & Documentation (1 week)
- Unit tests (90%+ coverage)
- Integration tests
- Documentation
- Example agents
- Migration guide

**Total Effort:** 7-8 weeks | **Total Complexity:** Medium

---

## 10. Success Criteria

### Technical
- All terminology updated consistently
- Agent definition schema working
- All CRUD endpoints functional
- Agent instantiation reliable (99%+ success)
- Tests: 95%+ code coverage
- No performance degradation

### User Experience
- Agent creation in < 5 minutes
- Intuitive UI for non-technical users
- Search/filter works quickly (< 500ms)
- Clear error messages

### Documentation
- Complete API documentation
- User guide with examples
- Developer guide
- Migration guide for existing users

---

## Summary

The Orchestrator/Agents feature transforms Agent Zero's agent system with:

1. **Better Terminology** - "Orchestrator" and "Agents" instead of "Agent Zero" and "Subordinates"
2. **Formal Agent Definitions** - Reusable, versionable agent configurations
3. **User-Friendly Creation** - Natural language to structured agent creation
4. **Complete Management** - CRUD operations, versioning, permission control
5. **Enterprise-Ready** - Isolation levels, access control, audit trails

This specification provides the foundation for a 7-8 week implementation with medium complexity and low risk, fully backward compatible with existing functionality.

For detailed implementation guidance, see:
- `ORCHESTRATOR_AGENTS_COMPONENT_BREAKDOWN.md` - Technical component details
- `ORCHESTRATOR_AGENTS_IMPLEMENTATION_CHECKLIST.md` - Step-by-step tasks
- `ORCHESTRATOR_AGENTS_QUICK_REFERENCE.md` - Quick lookup guide
