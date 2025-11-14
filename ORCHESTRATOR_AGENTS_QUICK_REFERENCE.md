# Orchestrator/Agents Feature - Quick Reference Guide

## One-Page Summary

### What is This Feature?

The Orchestrator/Agents feature refactors the terminology and infrastructure of Agent Zero's hierarchical agent system:

- **"Agent Zero"** becomes **"Orchestrator"** (main agent in a chat)
- **"Subordinates"** become **"Agents"** (spawned by orchestrator)
- Adds formal **Agent Definition Schema** for saving and reusing agent configurations
- Enables **Chat-to-Agent Creation** (natural language → structured agent)
- Introduces **Agent Management UI** with CRUD operations

### Why Do This?

1. **Clearer Terminology** - "Orchestrator" better describes the management role; "Agents" is the standard term
2. **Formalization** - Agents become first-class objects with schemas, versioning, and permissions
3. **User Empowerment** - Users can create and share custom agent types
4. **Enterprise Ready** - Supports isolation levels, access control, and multi-agent workflows

---

## Terminology Changes (Find & Replace)

| Old Term | New Term | Context |
|----------|----------|---------|
| `agent_zero`, `agent0` | `orchestrator` | Main agent instance |
| `subordinate` | `agent` | Spawned/managed agent |
| `superior` | `parent` | Reverse relationship |
| `call_subordinate` → tool | `spawn_agent` → tool | Tool for spawning agents |
| `DATA_NAME_SUBORDINATE` | `DATA_NAME_AGENT` | Agent class constants |
| `DATA_NAME_SUPERIOR` | `DATA_NAME_PARENT` | Agent class constants |
| `/agents/agent0/` | `/agents/orchestrator/` | Directory name |

**Files to Update:** ~20+ Python files, ~10+ prompt files, ~5+ UI files, README, docs

---

## Key Files to Create

### Python Backend

```
/python/helpers/
  ├── agent_registry.py          # CRUD for agent definitions
  ├── agent_schema.py            # JSON schema validation
  ├── agent_versioning.py        # Version control system
  └── agent_instantiation.py     # Factory for creating agents

/python/api/
  ├── agents_list.py             # GET /api/agents/list
  ├── agents_get.py              # GET /api/agents/{id}
  ├── agents_create.py           # POST /api/agents/create
  ├── agents_update.py           # PUT /api/agents/{id}/update
  ├── agents_delete.py           # DELETE /api/agents/{id}
  ├── agents_clone.py            # POST /api/agents/{id}/clone
  ├── agents_test.py             # POST /api/agents/test
  ├── agent_versions_list.py     # GET /api/agents/{id}/versions
  └── agent_versions_rollback.py # POST /api/agents/{id}/rollback

/python/tools/
  └── spawn_agent.py             # Renamed from call_subordinate.py
```

### UI Components

```
/webui/css/
  └── agents.css                 # Styling for agents features

/webui/components/settings/
  ├── agents-list.html           # Main agents list view
  ├── agents-detail.html         # Agent details panel
  ├── agents-create.html         # Create agent wizard
  ├── agents-edit.html           # Edit agent form
  ├── agents-toolbar.html        # Search & filter bar
  └── spawn-agent-modal.html     # Spawn agent dialog
```

### Configuration

```
/agents/custom-agents/           # New directory for saved agents
  ├── [agent-id]/
  │   ├── _definition.json       # Agent definition
  │   ├── _metadata.json         # Runtime metadata
  │   ├── system.md              # System prompt (markdown)
  │   └── _versions/             # Version history
```

---

## AgentDefinition Schema (At a Glance)

```json
{
  "id": "string (required)",
  "name": "string (required)",
  "description": "string",
  "version": "string (e.g., 1.0.0)",
  "tags": ["string"],
  
  "system_prompt": "string (required)",
  "instructions": "string",
  
  "temperature": "float (0-1)",
  "max_tokens": "integer",
  
  "tool_access": {
    "enabled": ["tool_name"],
    "disabled": ["tool_name"]
  },
  
  "isolation_level": "strict|moderate|permissive",
  "allow_spawning_agents": "boolean",
  "allow_knowledge_access": "boolean",
  "allow_memory_access": "boolean",
  
  "is_active": "boolean",
  "created_at": "ISO8601 datetime",
  "created_by": "string"
}
```

---

## Implementation Phases

### Phase 1: Terminology Refactoring (1-2 weeks)
- [ ] Update agent.py, models.py, initialize.py
- [ ] Update tools and prompts
- [ ] Update API endpoints
- [ ] Update UI/frontend
- [ ] Update documentation

**Complexity:** Medium | **Risk:** Low | **Effort:** 2-3 days

### Phase 2: Agent Definition Schema (1 week)
- [ ] Create AgentDefinition dataclass
- [ ] Implement schema validation
- [ ] Create file-based persistence
- [ ] Add migration utilities

**Complexity:** Medium | **Risk:** Low | **Effort:** 3-4 days

### Phase 3: Chat-to-Agent Creation (1-2 weeks)
- [ ] Design LLM prompts for intent analysis
- [ ] Implement system prompt generation
- [ ] Create UI wizard flow
- [ ] Add validation and testing

**Complexity:** High | **Risk:** Medium | **Effort:** 4-5 days

### Phase 4: Backend Storage & Retrieval (1-2 weeks)
- [ ] Implement all 9 API endpoints
- [ ] Add versioning system
- [ ] Add permission checking
- [ ] Add error handling

**Complexity:** Medium | **Risk:** Low | **Effort:** 3-4 days

### Phase 5: UI Agents Tab (1-2 weeks)
- [ ] Create Agents tab component
- [ ] Implement list view with search/filter
- [ ] Create agent details view
- [ ] Create create/edit forms
- [ ] Test responsive design

**Complexity:** Medium | **Risk:** Low | **Effort:** 4-5 days

### Phase 6: Agent Instantiation Logic (1 week)
- [ ] Update spawn_agent tool
- [ ] Implement configuration application
- [ ] Add hierarchical relationships
- [ ] Performance optimization

**Complexity:** Medium | **Risk:** Medium | **Effort:** 3-4 days

### Phase 7: Testing & Documentation (1 week)
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] UI/UX testing
- [ ] Documentation & examples

**Complexity:** Medium | **Risk:** Low | **Effort:** 3-4 days

**Total Effort:** 7-8 weeks | **Total Complexity:** Medium | **Total Risk:** Low-Medium

---

## API Endpoint Quick Reference

### List Agents
```bash
GET /api/agents/list?tags=code&active_only=true
```
Response: `{ agents: [...], total: 5 }`

### Get Single Agent
```bash
GET /api/agents/code-reviewer
```
Response: `{ agent: { AgentDefinition } }`

### Create Agent
```bash
POST /api/agents/create
Body: { name, description, system_prompt, ... }
```
Response: `{ status: "success", agent_id, agent: { } }`

### Update Agent
```bash
PUT /api/agents/code-reviewer/update
Body: { description, system_prompt, ... }
```
Response: `{ status: "success", agent: { } }`

### Delete Agent
```bash
DELETE /api/agents/code-reviewer
```
Response: `{ status: "success" }`

### Clone Agent
```bash
POST /api/agents/code-reviewer/clone
Body: { new_name: "Code Reviewer v2" }
```
Response: `{ agent_id: "code-reviewer-v2", ... }`

### Test Agent
```bash
POST /api/agents/test
Body: { agent_definition: { }, test_message: "Test prompt" }
```
Response: `{ response: "...", success: true }`

### List Versions
```bash
GET /api/agents/code-reviewer/versions
```
Response: `{ versions: [ { version, timestamp, change_summary } ] }`

### Rollback Version
```bash
POST /api/agents/code-reviewer/rollback
Body: { version: "v1.0.0_20240115_103000" }
```
Response: `{ status: "success", agent: { } }`

---

## Isolation Levels Explained

### Strict
- ❌ Cannot access knowledge base
- ❌ Cannot access memory
- ❌ Cannot spawn sub-agents
- **Use Case:** Third-party, untrusted, or sandboxed agents

### Moderate (Default)
- ✅ Can access knowledge base
- ✅ Can access limited memory
- ⚠️ Cannot spawn unrestricted sub-agents
- **Use Case:** Standard internal agents

### Permissive
- ✅ Can access all resources
- ✅ Can spawn unrestricted agents
- ✅ Full system access
- **Use Case:** Trusted development/system agents

---

## Permission Hierarchy

```
Can Spawn Agents?
  ↓
  Strict Agent → ❌ NO
  Moderate Agent → ✅ YES (with restrictions)
  Permissive Agent → ✅ YES (full)

Can Access Knowledge?
  ↓
  Strict Agent → ❌ NO
  Moderate Agent → ✅ YES (read-only)
  Permissive Agent → ✅ YES (full access)

Can Access Memory?
  ↓
  Strict Agent → ❌ NO
  Moderate Agent → ✅ YES (limited)
  Permissive Agent → ✅ YES (full)
```

---

## Model Selection Priority

```
1. Runtime config_override (highest priority)
   ↓
2. Agent definition model_config
   ↓
3. Parent agent's model
   ↓
4. Global user settings
   ↓
5. System defaults (lowest priority)
```

Example:
```python
# Parent uses GPT-4
orchestrator.config.chat_model = ModelConfig(provider="openai", name="gpt-4")

# Agent definition specifies Claude
definition.model_override = ModelOverride(provider="anthropic", name="claude-3")

# Runtime override
spawn_agent(agent_id="my-agent", config_override={"temperature": 0.3})

# Result: Claude-3 with temperature 0.3 is used ✓
```

---

## File Structure Changes

### Before
```
/agents/
├── _example/
├── agent0/              # Primary
├── default/
├── developer/
├── hacker/
└── researcher/
```

### After
```
/agents/
├── _example/            # (unchanged)
├── orchestrator/        # Renamed from agent0
│   ├── _definition.json # (NEW)
│   ├── _context.md
│   ├── system.md
│   └── _versions/       # (NEW)
├── default/             # (backward compat)
├── developer/           # (backward compat)
├── hacker/              # (backward compat)
├── researcher/          # (backward compat)
└── custom-agents/       # (NEW) - User-created agents
    ├── code-reviewer/
    │   ├── _definition.json
    │   └── ...
    └── research-assistant/
        ├── _definition.json
        └── ...
```

---

## Backward Compatibility

### During Migration
- Keep `call_subordinate` tool alongside `spawn_agent`
- Support both old and new terminology in code
- Auto-convert old agent profiles to new schema

### Deprecation Timeline
- v1: Introduce new terminology, mark old as deprecated
- v2: Warn on use of old terminology
- v3: Remove old terminology (breaking change)

---

## Testing Checklist

### Unit Tests
- [ ] AgentRegistry CRUD operations
- [ ] AgentSchemaValidator validation
- [ ] AgentVersionControl versioning
- [ ] AgentFactory instantiation
- [ ] Permission checks

### Integration Tests
- [ ] API endpoints with real database
- [ ] spawn_agent tool functionality
- [ ] Agent hierarchy relationships
- [ ] Tool access restrictions
- [ ] Knowledge/memory access controls

### UI/UX Tests
- [ ] Agents list loads and displays
- [ ] Create agent wizard flow (all 5 steps)
- [ ] Edit agent updates correctly
- [ ] Delete confirms and removes
- [ ] Search and filter work
- [ ] Responsive design (mobile/tablet/desktop)

### End-to-End Tests
- [ ] User creates agent via UI
- [ ] Agent appears in list
- [ ] User spawns agent from chat
- [ ] Agent executes correctly
- [ ] Version history tracks changes

---

## Common Pitfalls to Avoid

1. **Don't forget backward compatibility** - Keep old tools working for 1-2 versions
2. **Don't over-complicate the schema** - Start simple, add features later
3. **Don't skip validation** - Validate all user inputs at multiple layers
4. **Don't ignore permissions** - Security should be enforced at tool level, not just UI
5. **Don't hardcode isolation levels** - Make them configurable and extensible
6. **Don't forget error messages** - Users need clear feedback on what went wrong
7. **Don't create too many API endpoints** - Combine where logical (e.g., PATCH for updates)

---

## Success Metrics

### Technical KPIs
- 95%+ test coverage for new code
- < 500ms response time for agent list API
- < 100ms for loading single agent
- 99.9% spawn success rate

### User Experience KPIs
- First agent creation time: < 5 minutes
- 90%+ discoverability of Agents tab
- 80%+ retention (users creating > 1 agent)
- < 2% error rate during agent spawning

### Quality Metrics
- Zero critical bugs in first week
- Zero security vulnerabilities
- Documentation completeness: 100%
- Example agents: 3+ templates provided

---

## Key Decision Points

### Q1: File-based or Database-based Storage?
**Recommendation:** Start file-based (simpler), migrate to SQLite if needed

**Pros:**
- Simple version control (git-compatible)
- Human-readable JSON
- Easier to backup/restore
- No database dependency

**Cons:**
- Slower for large numbers of agents
- Manual file locking needed
- Limited query capabilities

### Q2: Free-form or Template-based Prompts?
**Recommendation:** Hybrid - support both

**Pros:**
- Flexibility for power users
- Consistency for beginners
- Easy migration path

### Q3: Per-agent or Role-based Permissions?
**Recommendation:** Per-agent with inheritance

**Pros:**
- Granular control
- Supports escalation
- Works with hierarchy

### Q4: Versioning Strategy?
**Recommendation:** Semantic versioning with git tags

**Pros:**
- Standard approach
- Clear migration path
- Works with existing workflows

---

## Links to Detailed Docs

- **Full Specification:** `ORCHESTRATOR_AGENTS_SPEC.md`
- **Component Breakdown:** `ORCHESTRATOR_AGENTS_COMPONENT_BREAKDOWN.md`
- **This Quick Reference:** `ORCHESTRATOR_AGENTS_QUICK_REFERENCE.md`

---

## Questions & Answers

**Q: Will this break existing chat histories?**
A: No - chat history format remains unchanged. Old chats continue to work.

**Q: Can users share agents?**
A: Yes, via export/import (agents as JSON files). Cloud sharing is a future enhancement.

**Q: How do I migrate existing agent profiles?**
A: Migration script will auto-convert old profiles to new schema on first run.

**Q: Can agents have custom tools?**
A: Yes, via the `tool_access` configuration and extension system.

**Q: What if agent definition has errors?**
A: Validation happens at creation time. Invalid definitions can't be saved or spawned.

**Q: How are agent stats tracked?**
A: Metadata stored in `_metadata.json`: spawn count, last used, response times, errors.

**Q: Can I version control agent definitions?**
A: Yes - store in git or use built-in version history. Both supported.

**Q: What about agent discovery?**
A: Built-in search, tags, and registry. Optional cloud registry in future versions.

---

## Next Steps

1. **Review** this quick reference with team
2. **Read** detailed specification and component breakdown
3. **Agree** on key decisions (storage, permissions, versioning)
4. **Create** implementation tickets for each phase
5. **Start** Phase 1: Terminology refactoring
6. **Iterate** through phases with testing between each

---

**Document Version:** 1.0  
**Last Updated:** January 20, 2024  
**Status:** Ready for Implementation  

