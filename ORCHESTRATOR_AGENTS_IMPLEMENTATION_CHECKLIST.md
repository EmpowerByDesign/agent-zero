# Orchestrator/Agents Feature - Implementation Checklist

## Overview

This document provides a comprehensive, step-by-step implementation checklist organized by phase. Use this as your primary reference during implementation to track progress and ensure nothing is missed.

---

## Phase 0: Pre-Implementation Setup

- [ ] Review all specification documents
- [ ] Set up feature branch: `feat/orchestrator-agents-spec` ✓ (Already done)
- [ ] Create directory structure for custom agents
- [ ] Set up test environment
- [ ] Prepare sample data for testing

**Estimated Time:** 2 hours

---

## Phase 1: Terminology Refactoring (Week 1-2)

### 1.1 Core Agent System (/agent.py)

- [ ] Rename class constants:
  - [ ] `DATA_NAME_SUBORDINATE` → `DATA_NAME_AGENT`
  - [ ] `DATA_NAME_SUPERIOR` → `DATA_NAME_PARENT`
  
- [ ] Update variable names:
  - [ ] `agent0` → `orchestrator` (in AgentContext)
  - [ ] References to "subordinate" → "agent"
  
- [ ] Add new helper methods:
  - [ ] `can_spawn_agents()` - Check if agent allowed to spawn
  - [ ] `get_parent_agent()` - Get parent agent if exists
  - [ ] `is_isolated()` - Check isolation level
  
- [ ] Update docstrings and comments

- [ ] Update error messages to reflect new terminology

- [ ] Test: All tests pass with new terminology

**Subtasks:**
- [ ] Find & replace all occurrences
- [ ] Update function signatures
- [ ] Update return type hints
- [ ] Run linter and formatter

### 1.2 Configuration & Initialization (/initialize.py, /models.py)

- [ ] Update initialization comments and docstrings
- [ ] Ensure profile selection still works with new terminology
- [ ] Test initialization with different profiles

### 1.3 Tools (/python/tools/call_subordinate.py)

- [ ] Rename file: `call_subordinate.py` → `spawn_agent.py`
- [ ] Update class name: `Delegation` → `SpawnAgent`
- [ ] Update all internal references to new terminology
- [ ] Update docstrings
- [ ] Update log messages
- [ ] Keep old tool aliased for backward compatibility

**Subtasks:**
- [ ] Create new file with updated code
- [ ] Create alias in old location (deprecated)
- [ ] Add deprecation warning
- [ ] Update tool registry

### 1.4 Prompts (/prompts/)

- [ ] Rename: `agent.system.tool.call_sub.py` → `agent.system.tool.spawn_agent.py`
- [ ] Update VariablesPlugin class name
- [ ] Update all references in prompt templates
- [ ] Update system prompt files:
  - [ ] `agents/orchestrator/_context.md` comments
  - [ ] All agent profile context files
  - [ ] System prompt template files
- [ ] Update tool prompts that mention subordinates/agents

**Subtasks:**
- [ ] Search for "subordinate" in all prompt files
- [ ] Replace with "agent"
- [ ] Search for "agent zero" in all prompt files
- [ ] Replace with "orchestrator"
- [ ] Test prompt rendering

### 1.5 API Endpoints (/python/api/)

**Update these files:**
- [ ] `message.py` - User message handling
- [ ] `api_message.py` - Message API
- [ ] `history_get.py` - Chat history
- [ ] `backup_create.py`, `backup_restore.py` - Backup handling

**Changes:**
- [ ] Update variable names
- [ ] Update docstrings
- [ ] Update log messages
- [ ] Update error messages
- [ ] Update response field names if needed

**Subtasks:**
- [ ] Grep for "subordinate" in all api files
- [ ] Replace with "agent"
- [ ] Grep for "agent0" in api files
- [ ] Replace appropriately

### 1.6 Extensions (/python/extensions/)

**Key files to update:**
- [ ] `agent_init/_10_initial_message.py`
- [ ] Any custom extensions using old terminology

**Changes:**
- [ ] Update variable names
- [ ] Update log messages
- [ ] Update docstrings

### 1.7 Helpers (/python/helpers/)

**Update these helper files:**
- [ ] `settings.py` - References to agent terminology
- [ ] `api.py` - API handler helpers
- [ ] `persist_chat.py` - Chat persistence
- [ ] `backup.py` - Backup utilities
- [ ] `task_scheduler.py` - Scheduler references

### 1.8 WebUI (/webui/)

#### 1.8.1 HTML Files
- [ ] `/webui/index.html`:
  - [ ] Update page title if needed
  - [ ] Update button labels
  - [ ] Update placeholder text
  - [ ] Update comments

#### 1.8.2 CSS Files
- [ ] `/webui/css/settings.css` - Update any class names/comments
- [ ] `/webui/css/messages.css` - Update message styling references
- [ ] Other CSS files for any agent-related styles

#### 1.8.3 JavaScript Files
- [ ] `/webui/index.js`:
  - [ ] Update variable names
  - [ ] Update API endpoint references (if any)
  - [ ] Update event handler names
  - [ ] Update comments

- [ ] `/webui/js/settings.js`:
  - [ ] Update settings-related terminology

#### 1.8.4 Components
- [ ] Check `/webui/components/` for any agent-related code
- [ ] Update component names if needed
- [ ] Update component comments

### 1.9 Documentation

- [ ] Update `/README.md`:
  - [ ] Update feature descriptions
  - [ ] Update terminology throughout
  - [ ] Update architecture overview
  - [ ] Update quick start guide
  
- [ ] Update `/docs/` files:
  - [ ] Update all architecture docs
  - [ ] Update API documentation
  - [ ] Update terminology glossary
  - [ ] Update examples

### 1.10 Testing & Verification

- [ ] Run full test suite - verify all tests pass
- [ ] Run linter (pylint/flake8) - fix any issues
- [ ] Run formatter (black) - ensure consistent style
- [ ] Type checker (mypy) - verify type hints
- [ ] Manual testing:
  - [ ] Start new chat - orchestrator loads correctly
  - [ ] Check agent context initialization
  - [ ] Verify log messages show new terminology
  - [ ] Check that old tools still work (deprecated)

**Subtasks:**
- [ ] Create test cases for new terminology
- [ ] Update existing test assertions
- [ ] Test backward compatibility
- [ ] Check that deprecation warnings appear

**Estimated Time:** 5-7 days

---

## Phase 2: Agent Definition Schema (Week 2-3)

### 2.1 Create Data Models (/agent.py)

- [ ] Create `IsolationLevel` Enum:
  - [ ] STRICT
  - [ ] MODERATE
  - [ ] PERMISSIVE

- [ ] Create `ToolAccess` dataclass:
  - [ ] enabled: List[str]
  - [ ] disabled: List[str]
  - [ ] is_allowed(tool_name): bool method

- [ ] Create `ModelOverride` dataclass:
  - [ ] provider: Optional[str]
  - [ ] name: Optional[str]
  - [ ] temperature: Optional[float]
  - [ ] max_tokens: Optional[int]
  - [ ] api_base: Optional[str]
  - [ ] kwargs: Dict

- [ ] Create `AgentDefinition` dataclass:
  - [ ] All fields from spec (see specification doc)
  - [ ] Implement to_dict() method
  - [ ] Implement from_dict() classmethod
  - [ ] Add validation method

**Subtasks:**
- [ ] Write dataclass definitions
- [ ] Add type hints
- [ ] Add docstrings
- [ ] Test serialization/deserialization

### 2.2 Create Agent Registry Helper (/python/helpers/agent_registry.py)

- [ ] Create `AgentRegistry` class with methods:
  - [ ] `ensure_dir()` - Create custom-agents directory
  - [ ] `load_agent(agent_id)` - Load from JSON
  - [ ] `save_agent(definition)` - Save to JSON
  - [ ] `list_agents(tags, active_only)` - List all agents
  - [ ] `delete_agent(agent_id)` - Delete agent directory
  - [ ] `agent_exists(agent_id)` - Check existence
  - [ ] `validate_agent_definition(data)` - Validate schema

- [ ] Error handling:
  - [ ] Handle missing files gracefully
  - [ ] Validate file permissions
  - [ ] Handle JSON parse errors
  - [ ] Provide clear error messages

**Subtasks:**
- [ ] Implement each method
- [ ] Add error handling
- [ ] Add logging
- [ ] Test with sample data

### 2.3 Create Schema Validator (/python/helpers/agent_schema.py)

- [ ] Define JSON schema in `AGENT_DEFINITION_SCHEMA`
- [ ] Create `AgentSchemaValidator` class:
  - [ ] `validate(data)` - Validate against schema
  - [ ] `get_schema()` - Return schema for UI
  
- [ ] Validation rules:
  - [ ] Required fields: id, name, system_prompt
  - [ ] ID format: lowercase alphanumeric + hyphens
  - [ ] Temperature: 0-1 range
  - [ ] Isolation level: valid enum
  - [ ] Tool names: valid tool identifiers

**Subtasks:**
- [ ] Define schema using jsonschema
- [ ] Test validation with valid/invalid data
- [ ] Provide clear error messages
- [ ] Test edge cases

### 2.4 Create Versioning System (/python/helpers/agent_versioning.py)

- [ ] Create `AgentVersionControl` class with methods:
  - [ ] `create_version(definition, change_summary)` - Save version
  - [ ] `get_version_history(agent_id)` - List versions
  - [ ] `rollback_to_version(agent_id, version_file)` - Restore version

- [ ] Version file naming:
  - [ ] Format: `v{version}_{timestamp}.json`
  - [ ] Example: `v1.0.0_20240115_103000.json`

- [ ] Metadata tracking:
  - [ ] version number
  - [ ] timestamp
  - [ ] change_summary
  - [ ] updated_by

**Subtasks:**
- [ ] Implement version storage
- [ ] Test version history
- [ ] Test rollback functionality
- [ ] Clean up old versions (optional)

### 2.5 Create Agent Metadata System (/python/helpers/agent_registry.py)

- [ ] Create `AgentMetadata` dataclass:
  - [ ] spawn_count
  - [ ] last_spawned
  - [ ] total_messages
  - [ ] average_response_time
  - [ ] error_count
  - [ ] usage_score
  - [ ] to_dict() method

- [ ] Storage:
  - [ ] Save metadata in `_metadata.json`
  - [ ] Update on agent spawn/use
  - [ ] Persist to disk

**Subtasks:**
- [ ] Create metadata dataclass
- [ ] Implement update logic
- [ ] Test metadata persistence
- [ ] Add stats aggregation

### 2.6 File Structure Setup

- [ ] Create `/agents/custom-agents/` directory
- [ ] Create sample agent definition structure
- [ ] Create `.gitignore` entries:
  - [ ] `/agents/custom-agents/*`
  - [ ] `!.gitkeep`
  - [ ] Or track custom agents if desired

- [ ] Create migration utilities:
  - [ ] Script to convert old profiles to new schema
  - [ ] Handle legacy _context.md files
  - [ ] Test migration with existing agents

**Subtasks:**
- [ ] Create directory structure
- [ ] Create sample files
- [ ] Write migration script
- [ ] Test migrations

### 2.7 Testing & Verification

- [ ] Unit tests for AgentRegistry:
  - [ ] Test load/save operations
  - [ ] Test list filtering
  - [ ] Test validation
  - [ ] Test error cases

- [ ] Unit tests for AgentSchemaValidator:
  - [ ] Test valid definitions
  - [ ] Test invalid definitions
  - [ ] Test edge cases
  - [ ] Test error messages

- [ ] Unit tests for AgentVersionControl:
  - [ ] Test version creation
  - [ ] Test version history
  - [ ] Test rollback
  - [ ] Test version file cleanup

- [ ] Integration tests:
  - [ ] Load/save/load cycle
  - [ ] Multiple agent definitions
  - [ ] File system operations
  - [ ] Migration from old format

**Subtasks:**
- [ ] Write pytest test cases
- [ ] Achieve 90%+ code coverage
- [ ] Test with real files
- [ ] Test error scenarios

**Estimated Time:** 5-7 days

---

## Phase 3: Chat-to-Agent Creation (Week 3-4)

### 3.1 Design Intent Analysis Prompts

- [ ] Create system prompt for intent analysis:
  - [ ] Parse user requirements
  - [ ] Extract key characteristics
  - [ ] Suggest tools and settings
  - [ ] Output structured JSON

- [ ] Create system prompt for prompt generation:
  - [ ] Generate system prompt from intent
  - [ ] Ensure prompt is detailed and actionable
  - [ ] Follow best practices
  - [ ] Output ready-to-use prompt

**Subtasks:**
- [ ] Write and test prompts
- [ ] Verify JSON output format
- [ ] Test with various user inputs
- [ ] Refine based on results

### 3.2 Implement Intent Analysis Service

**File:** `/python/helpers/agent_creation_service.py`

- [ ] Create `AgentIntentAnalyzer` class:
  - [ ] `analyze_intent(user_description)` → Dict with structured intent
  - [ ] Extract purpose, capabilities, tools, tone, constraints
  - [ ] Return structured data for definition generation

- [ ] Create `AgentPromptGenerator` class:
  - [ ] `generate_system_prompt(intent)` → str with system prompt
  - [ ] `generate_tool_list(intent)` → List of recommended tools
  - [ ] `suggest_model(intent)` → Model recommendation

- [ ] Error handling:
  - [ ] Handle LLM failures gracefully
  - [ ] Validate generated content
  - [ ] Provide fallback values

**Subtasks:**
- [ ] Implement analyzer class
- [ ] Implement generator class
- [ ] Add error handling
- [ ] Add logging
- [ ] Test with various inputs

### 3.3 Create Chat-Based Creation API

**File:** `/python/api/agents_create_interactive.py`

- [ ] Create endpoint: `POST /api/agents/create-interactive`
- [ ] Request flow:
  - [ ] User submits description
  - [ ] System analyzes intent
  - [ ] System generates definition
  - [ ] Return definition for user approval

- [ ] Response structure:
  - [ ] suggested_definition: AgentDefinition
  - [ ] analysis: {purpose, tools, tone, etc}
  - [ ] preview: agent behavior examples

**Subtasks:**
- [ ] Implement API endpoint
- [ ] Test request/response cycle
- [ ] Add rate limiting
- [ ] Add error handling

### 3.4 Implement Refinement Loop

- [ ] Allow users to modify suggestions:
  - [ ] Edit any field
  - [ ] Re-generate portions
  - [ ] Test with sample inputs
  - [ ] Final confirmation

- [ ] API: `POST /api/agents/create-interactive/refine`
  - [ ] Accept modified definition
  - [ ] Re-analyze if description changed
  - [ ] Return updated suggestions

**Subtasks:**
- [ ] Design refinement flow
- [ ] Implement modification endpoints
- [ ] Add validation at each step
- [ ] Test full flow

### 3.5 Testing & Verification

- [ ] Unit tests for intent analyzer:
  - [ ] Test with various descriptions
  - [ ] Test JSON output format
  - [ ] Test error cases

- [ ] Integration tests:
  - [ ] Full creation flow
  - [ ] Refinement loop
  - [ ] Final agent creation

- [ ] User acceptance tests:
  - [ ] Create agent from description
  - [ ] Verify agent works as expected
  - [ ] Test with various use cases

**Subtasks:**
- [ ] Write test cases
- [ ] Test various user inputs
- [ ] Verify generated agents work
- [ ] Document examples

**Estimated Time:** 6-8 days

---

## Phase 4: Backend Storage & Retrieval APIs (Week 4-5)

### 4.1 Create Base API Handler

**File:** `/python/api/agents_base.py`

- [ ] Create `AgentApiHandler` base class:
  - [ ] Extend ApiHandler
  - [ ] Common validation methods
  - [ ] Common error handling
  - [ ] Common response formatting

**Subtasks:**
- [ ] Implement base class
- [ ] Add helper methods
- [ ] Add error handling

### 4.2 Implement API Endpoints (9 endpoints)

#### 4.2.1 List Agents - `/api/agents/list`
**File:** `/python/api/agents_list.py`

- [ ] GET request handling
- [ ] Query parameters:
  - [ ] tags: filter by tags
  - [ ] active_only: show only active agents
  - [ ] search: search in name/description
  - [ ] sort: sort field (name, created_at, last_spawned)
  - [ ] limit: pagination limit
  - [ ] offset: pagination offset

- [ ] Response:
  - [ ] agents: list of agent summaries
  - [ ] total: total count
  - [ ] status: "success" or "error"

**Subtasks:**
- [ ] Implement filtering logic
- [ ] Implement sorting
- [ ] Implement pagination
- [ ] Add error handling
- [ ] Test all parameters

#### 4.2.2 Get Agent - `/api/agents/{agent_id}`
**File:** `/python/api/agents_get.py`

- [ ] GET single agent definition
- [ ] Response:
  - [ ] agent: full AgentDefinition
  - [ ] metadata: usage statistics
  - [ ] versions: recent versions
  - [ ] status: "success" or "error"

**Subtasks:**
- [ ] Load agent definition
- [ ] Load metadata
- [ ] Load recent versions
- [ ] Handle not found error
- [ ] Test error cases

#### 4.2.3 Create Agent - `/api/agents/create`
**File:** `/python/api/agents_create.py`

- [ ] POST request handling
- [ ] Request validation:
  - [ ] Schema validation
  - [ ] Required fields check
  - [ ] ID uniqueness check
  - [ ] Tool availability check

- [ ] Save agent:
  - [ ] Save definition to disk
  - [ ] Create version baseline
  - [ ] Initialize metadata

- [ ] Response:
  - [ ] agent_id: created agent ID
  - [ ] agent: AgentDefinition
  - [ ] status: "success" or "error"

**Subtasks:**
- [ ] Implement validation
- [ ] Implement save logic
- [ ] Add error handling
- [ ] Test creation flow
- [ ] Test validation errors

#### 4.2.4 Update Agent - `/api/agents/{agent_id}/update`
**File:** `/python/api/agents_update.py`

- [ ] PUT request handling
- [ ] Partial update support
- [ ] Version creation:
  - [ ] Auto-increment version number
  - [ ] Preserve previous version
  - [ ] Create version history entry

- [ ] Response:
  - [ ] agent: updated AgentDefinition
  - [ ] new_version: version number
  - [ ] status: "success" or "error"

**Subtasks:**
- [ ] Implement update logic
- [ ] Handle version incrementing
- [ ] Create version backup
- [ ] Test partial updates
- [ ] Test validation

#### 4.2.5 Delete Agent - `/api/agents/{agent_id}`
**File:** `/python/api/agents_delete.py`

- [ ] DELETE request handling
- [ ] Safety checks:
  - [ ] Confirm ID exists
  - [ ] Backup before delete (optional)
  - [ ] Prevent deletion of system agents

- [ ] Cleanup:
  - [ ] Delete definition
  - [ ] Delete metadata
  - [ ] Delete versions (or archive)

- [ ] Response:
  - [ ] deleted_agent_id: the deleted agent
  - [ ] status: "success" or "error"

**Subtasks:**
- [ ] Implement delete logic
- [ ] Add safety checks
- [ ] Backup agent before deletion
- [ ] Test error cases
- [ ] Test cascade cleanup

#### 4.2.6 Clone Agent - `/api/agents/{agent_id}/clone`
**File:** `/python/api/agents_clone.py`

- [ ] POST request handling
- [ ] Clone parameters:
  - [ ] new_id: new agent identifier (optional, auto-generate)
  - [ ] new_name: display name for clone (optional)

- [ ] Clone operation:
  - [ ] Copy definition
  - [ ] Increment version
  - [ ] Reset usage stats
  - [ ] Update timestamps
  - [ ] Save as new agent

- [ ] Response:
  - [ ] cloned_agent_id: new agent ID
  - [ ] agent: cloned AgentDefinition
  - [ ] status: "success" or "error"

**Subtasks:**
- [ ] Implement clone logic
- [ ] Generate unique ID for clone
- [ ] Reset appropriate fields
- [ ] Test clone operation
- [ ] Test version independence

#### 4.2.7 Test Agent - `/api/agents/test`
**File:** `/python/api/agents_test.py`

- [ ] POST request handling
- [ ] Test parameters:
  - [ ] agent_definition: definition to test
  - [ ] test_message: message to send to agent
  - [ ] max_length: max response length (optional)

- [ ] Test execution:
  - [ ] Instantiate agent from definition
  - [ ] Send test message
  - [ ] Capture response
  - [ ] Record any errors

- [ ] Response:
  - [ ] response: agent's response
  - [ ] success: true/false
  - [ ] error: error message if failed
  - [ ] duration: execution time

**Subtasks:**
- [ ] Implement test flow
- [ ] Handle agent creation
- [ ] Capture response safely
- [ ] Add timeout handling
- [ ] Test error scenarios

#### 4.2.8 List Versions - `/api/agents/{agent_id}/versions`
**File:** `/python/api/agent_versions_list.py`

- [ ] GET request handling
- [ ] Load version history:
  - [ ] List all versions
  - [ ] Include timestamps
  - [ ] Include change summaries
  - [ ] Sort by date descending

- [ ] Response:
  - [ ] versions: list of version info
  - [ ] current_version: current version number
  - [ ] total: version count

**Subtasks:**
- [ ] Implement version loading
- [ ] Format version information
- [ ] Add error handling
- [ ] Test with multiple versions

#### 4.2.9 Rollback Version - `/api/agents/{agent_id}/rollback`
**File:** `/python/api/agent_versions_rollback.py`

- [ ] POST request handling
- [ ] Rollback parameters:
  - [ ] version: version file to restore
  - [ ] create_backup: backup current before rollback (default: true)

- [ ] Rollback operation:
  - [ ] Backup current version
  - [ ] Restore requested version
  - [ ] Update timestamps
  - [ ] Save as new version

- [ ] Response:
  - [ ] agent: restored AgentDefinition
  - [ ] previous_version: what was current before rollback
  - [ ] status: "success" or "error"

**Subtasks:**
- [ ] Implement rollback logic
- [ ] Create backup before rollback
- [ ] Test restoration
- [ ] Test with invalid versions
- [ ] Test rollback chain

### 4.3 Permission & Access Control

- [ ] Add permission checking to all endpoints:
  - [ ] Verify user owns agent (if multi-user)
  - [ ] Check isolation level permissions
  - [ ] Verify agent is active (for spawn operations)

- [ ] Create `AgentPermissionChecker` class:
  - [ ] `can_create_agent(user)` → bool
  - [ ] `can_modify_agent(user, agent)` → bool
  - [ ] `can_delete_agent(user, agent)` → bool
  - [ ] `can_spawn_agent(parent, agent)` → bool

**Subtasks:**
- [ ] Design permission model
- [ ] Implement permission checks
- [ ] Add authorization middleware
- [ ] Test permission enforcement

### 4.4 Error Handling & Validation

- [ ] Comprehensive error handling:
  - [ ] HTTP status codes (400, 404, 500, etc.)
  - [ ] Error messages (clear, actionable)
  - [ ] Logging (all errors logged)
  - [ ] Rate limiting (if needed)

- [ ] Input validation:
  - [ ] All inputs validated
  - [ ] Type checking
  - [ ] Length constraints
  - [ ] Format validation

**Subtasks:**
- [ ] Create error response handler
- [ ] Add validation layer
- [ ] Add logging
- [ ] Test error cases

### 4.5 Testing & Verification

- [ ] Unit tests for each endpoint:
  - [ ] Test with valid inputs
  - [ ] Test with invalid inputs
  - [ ] Test error cases
  - [ ] Test edge cases

- [ ] Integration tests:
  - [ ] Full CRUD cycle
  - [ ] Multi-operation sequences
  - [ ] File system operations
  - [ ] Permission checks

- [ ] Performance tests:
  - [ ] Response time < 500ms for list
  - [ ] Response time < 100ms for get
  - [ ] Memory usage acceptable

**Subtasks:**
- [ ] Write comprehensive tests
- [ ] Achieve 90%+ coverage
- [ ] Performance testing
- [ ] Load testing (optional)

**Estimated Time:** 6-8 days

---

## Phase 5: UI Agents Tab (Week 5-6)

### 5.1 Create Agents Tab Component

**File:** `/webui/components/agents/` (new directory)

- [ ] Create tab structure:
  - [ ] agents-list.html - Main view
  - [ ] agents-detail.html - Details panel
  - [ ] agents-create.html - Create wizard
  - [ ] agents-edit.html - Edit form
  - [ ] spawn-agent-dialog.html - Spawn dialog

- [ ] Add to main UI:
  - [ ] Update `/webui/index.html`:
    - [ ] Add Agents tab button
    - [ ] Add agents-section div
    - [ ] Link agents tab to handlers

### 5.2 Implement Agents List Component

**File:** `/webui/components/agents/agents-list.html`

- [ ] List display:
  - [ ] Table view with columns: Name, Description, Tags, Version, Last Used, Actions
  - [ ] Card view (mobile-friendly)
  - [ ] Toggle between views

- [ ] Features:
  - [ ] Search functionality (client-side or server-side)
  - [ ] Filter by tags
  - [ ] Filter by status (active/inactive)
  - [ ] Sort by various fields
  - [ ] Pagination

- [ ] Interactions:
  - [ ] Click agent to show details
  - [ ] Hover shows action buttons
  - [ ] Context menu (three dots):
    - [ ] Edit
    - [ ] Clone
    - [ ] Test
    - [ ] Stats
    - [ ] Delete

- [ ] Empty state:
  - [ ] "No agents yet" message
  - [ ] Link to create agent

**Subtasks:**
- [ ] Create HTML structure
- [ ] Implement Alpine.js data binding
- [ ] Add fetch calls to API
- [ ] Implement search/filter logic
- [ ] Add action handlers
- [ ] Style with CSS

### 5.3 Implement Agent Details Panel

**File:** `/webui/components/agents/agents-detail.html`

- [ ] Display information:
  - [ ] Name, description
  - [ ] Version, creation date
  - [ ] Tags, isolation level
  - [ ] System prompt preview
  - [ ] Tool list
  - [ ] Permissions

- [ ] Statistics:
  - [ ] Times spawned
  - [ ] Last used
  - [ ] Average response time
  - [ ] Error count

- [ ] Actions:
  - [ ] Edit button
  - [ ] Clone button
  - [ ] Delete button
  - [ ] Test button
  - [ ] View versions button

- [ ] Responsive:
  - [ ] Side panel on desktop
  - [ ] Modal on mobile

**Subtasks:**
- [ ] Create HTML structure
- [ ] Add data binding
- [ ] Implement action handlers
- [ ] Add styling
- [ ] Test responsive design

### 5.4 Implement Create Agent Wizard

**File:** `/webui/components/agents/agents-create.html`

- [ ] Multi-step form (5 steps):

  **Step 1: Basic Information**
  - [ ] Agent ID input (validate format)
  - [ ] Display name input
  - [ ] Description textarea
  - [ ] Tags input

  **Step 2: Functionality**
  - [ ] Tool selection (checkboxes)
  - [ ] Extension selection (checkboxes)
  - [ ] Tool restrictions (enable/disable)

  **Step 3: Behavior**
  - [ ] System prompt editor (Ace or similar)
  - [ ] Temperature slider (0-1)
  - [ ] Max tokens input
  - [ ] Model selection dropdown

  **Step 4: Permissions**
  - [ ] Isolation level selector
  - [ ] Permission checkboxes:
    - [ ] Allow spawning sub-agents
    - [ ] Allow knowledge access
    - [ ] Allow memory access

  **Step 5: Review**
  - [ ] Display summary
  - [ ] Show system prompt preview
  - [ ] Button to edit any field
  - [ ] Create button

- [ ] Features:
  - [ ] Step navigation (previous/next)
  - [ ] Step indicator
  - [ ] Form validation at each step
  - [ ] Error messages
  - [ ] Autosave draft (optional)

**Subtasks:**
- [ ] Create wizard HTML structure
- [ ] Implement step navigation
- [ ] Add form validation
- [ ] Add Alpine.js data binding
- [ ] Implement create logic
- [ ] Add error handling
- [ ] Style all steps

### 5.5 Implement Edit Agent Form

**File:** `/webui/components/agents/agents-edit.html`

- [ ] Load existing agent data
- [ ] Allow editing:
  - [ ] All fields from create (except ID)
  - [ ] System prompt
  - [ ] Tools/extensions
  - [ ] Model config
  - [ ] Permissions

- [ ] Version management:
  - [ ] Show current version
  - [ ] Option to create new version
  - [ ] Diff view (optional)
  - [ ] Change summary input

- [ ] Actions:
  - [ ] Save button
  - [ ] Cancel button
  - [ ] Revert to previous version button

**Subtasks:**
- [ ] Create edit form HTML
- [ ] Implement data loading
- [ ] Add form fields
- [ ] Implement validation
- [ ] Add version handling
- [ ] Style form

### 5.6 Implement Spawn Agent Dialog

**File:** `/webui/components/agents/spawn-agent-dialog.html`

- [ ] Triggered when:
  - [ ] User selects spawn_agent tool in chat
  - [ ] Agent details page "Spawn" button clicked

- [ ] Dialog content:
  - [ ] Agent name and description
  - [ ] Configuration preview
  - [ ] Optional config override fields
  - [ ] Spawn button
  - [ ] Cancel button

- [ ] On spawn:
  - [ ] Call spawn_agent tool
  - [ ] Pass agent ID and any overrides
  - [ ] Return to chat with agent spawned

**Subtasks:**
- [ ] Create dialog HTML
- [ ] Add agent information display
- [ ] Add override options
- [ ] Implement spawn logic
- [ ] Add error handling

### 5.7 Create Agents Styling

**File:** `/webui/css/agents.css`

- [ ] Components:
  - [ ] Agent list styling
  - [ ] Agent detail panel
  - [ ] Create/edit form
  - [ ] Dialog styling
  - [ ] Modal styling

- [ ] Features:
  - [ ] Dark mode support
  - [ ] Responsive design
  - [ ] Hover effects
  - [ ] Animations
  - [ ] Loading states

- [ ] Consistency:
  - [ ] Match existing theme
  - [ ] Use existing color palette
  - [ ] Use existing typography
  - [ ] Follow existing patterns

**Subtasks:**
- [ ] Write CSS for all components
- [ ] Test dark mode
- [ ] Test responsive design
- [ ] Test animations
- [ ] Refine styling

### 5.8 Create JavaScript Handler

**File:** `/webui/js/agents.js`

- [ ] Main functions:
  - [ ] loadAgentsList()
  - [ ] searchAgents(query)
  - [ ] filterAgents(criteria)
  - [ ] sortAgents(field)
  - [ ] createAgent(definition)
  - [ ] updateAgent(id, updates)
  - [ ] deleteAgent(id)
  - [ ] cloneAgent(id)
  - [ ] testAgent(definition)
  - [ ] spawnAgent(id, config)

- [ ] State management:
  - [ ] Current agents list
  - [ ] Selected agent
  - [ ] Create form state
  - [ ] Edit form state
  - [ ] Filter/sort state

- [ ] API interactions:
  - [ ] Fetch agents from API
  - [ ] POST create requests
  - [ ] PUT update requests
  - [ ] DELETE requests
  - [ ] Error handling

**Subtasks:**
- [ ] Write JavaScript functions
- [ ] Implement API calls
- [ ] Add error handling
- [ ] Test all functions

### 5.9 Integration with Main UI

- [ ] Update `/webui/index.html`:
  - [ ] Add Agents tab button
  - [ ] Add agents-section container
  - [ ] Link tab click to load agents view

- [ ] Update `/webui/index.js`:
  - [ ] Add agents tab event listener
  - [ ] Add loadAgents() function
  - [ ] Add integration with chat features

- [ ] Update CSS:
  - [ ] Add agents CSS link
  - [ ] Ensure theme consistency

**Subtasks:**
- [ ] Update main HTML file
- [ ] Update main JavaScript
- [ ] Link CSS files
- [ ] Test tab switching

### 5.10 Testing & Verification

- [ ] Component tests:
  - [ ] List loads correctly
  - [ ] Search/filter works
  - [ ] Create wizard completes
  - [ ] Edit saves changes
  - [ ] Delete confirms and removes

- [ ] UI/UX tests:
  - [ ] Mobile responsiveness
  - [ ] Accessibility (keyboard nav, screen readers)
  - [ ] Dark mode rendering
  - [ ] Form validation messages
  - [ ] Error states

- [ ] Integration tests:
  - [ ] Tab switching works
  - [ ] Data persists across views
  - [ ] API calls work correctly
  - [ ] Navigation works

**Subtasks:**
- [ ] Write component tests
- [ ] Test responsive design
- [ ] Test accessibility
- [ ] Test all interactions
- [ ] Fix any issues

**Estimated Time:** 6-8 days

---

## Phase 6: Agent Instantiation Logic (Week 6-7)

### 6.1 Create Agent Factory

**File:** `/python/helpers/agent_instantiation.py`

- [ ] Create `AgentFactory` class with methods:
  - [ ] `create_from_definition(parent, definition, config_override)` → Agent
  - [ ] `_check_permission(parent, definition)` → bool
  - [ ] `_apply_model_settings(agent, definition)` → None
  - [ ] `_apply_tool_restrictions(agent, definition)` → None
  - [ ] `_apply_extensions(agent, definition)` → None

- [ ] Permission checking:
  - [ ] Check parent's isolation level
  - [ ] Check agent's active status
  - [ ] Check isolation compatibility

- [ ] Configuration application:
  - [ ] Apply model override if specified
  - [ ] Apply temperature/token settings
  - [ ] Apply config overrides
  - [ ] Set system prompt

**Subtasks:**
- [ ] Implement factory class
- [ ] Add permission checking
- [ ] Add configuration logic
- [ ] Add error handling
- [ ] Write unit tests

### 6.2 Update spawn_agent Tool

**File:** `/python/tools/spawn_agent.py`

- [ ] Replace old Delegation class with SpawnAgent
- [ ] Update execute method:
  - [ ] Load agent definition
  - [ ] Check permissions
  - [ ] Determine reuse vs. create
  - [ ] Use AgentFactory to create
  - [ ] Add user message
  - [ ] Run agent monologue
  - [ ] Update usage stats
  - [ ] Return response

- [ ] Error handling:
  - [ ] Handle missing agents
  - [ ] Handle permission errors
  - [ ] Handle execution errors
  - [ ] Provide clear error messages

- [ ] Logging:
  - [ ] Log agent spawn
  - [ ] Log errors
  - [ ] Track usage stats

**Subtasks:**
- [ ] Implement new tool
- [ ] Add error handling
- [ ] Add logging
- [ ] Test tool execution
- [ ] Test reuse vs. create logic

### 6.3 Add Hierarchy Management

- [ ] Update Agent class:
  - [ ] Set parent relationship when spawning
  - [ ] Maintain parent chain
  - [ ] Provide parent access methods
  - [ ] Track agent depth/level

- [ ] Add hierarchical methods:
  - [ ] `get_parent()` → Agent
  - [ ] `get_root_agent()` → Agent
  - [ ] `get_depth()` → int
  - [ ] `get_ancestors()` → List[Agent]

**Subtasks:**
- [ ] Add methods to Agent class
- [ ] Test parent/child relationships
- [ ] Test ancestor chain
- [ ] Test depth calculation

### 6.4 Add Permission Enforcement

- [ ] Create permission enforcement middleware:
  - [ ] Check isolation level before tool access
  - [ ] Check knowledge access permissions
  - [ ] Check memory access permissions
  - [ ] Check sub-agent spawning permissions

- [ ] Implement in tool execution:
  - [ ] Pre-execution permission check
  - [ ] Throw PermissionError if denied
  - [ ] Log permission violations

**Subtasks:**
- [ ] Create permission checker
- [ ] Add to tool pipeline
- [ ] Test permission enforcement
- [ ] Test permission denial

### 6.5 Add Configuration Application

- [ ] Implement configuration hierarchy:
  - [ ] Runtime overrides (highest priority)
  - [ ] Definition settings
  - [ ] Parent settings
  - [ ] Global settings
  - [ ] System defaults (lowest priority)

- [ ] Apply settings:
  - [ ] Model selection
  - [ ] Temperature
  - [ ] Token limits
  - [ ] Extensions
  - [ ] Custom config

**Subtasks:**
- [ ] Implement configuration merging
- [ ] Test priority order
- [ ] Test configuration application
- [ ] Test edge cases

### 6.6 Add Usage Tracking

- [ ] Update agent metadata:
  - [ ] Increment spawn_count
  - [ ] Update last_spawned
  - [ ] Track response time
  - [ ] Track errors

- [ ] Persist metadata:
  - [ ] Save to _metadata.json
  - [ ] Update on each spawn
  - [ ] Aggregate statistics

**Subtasks:**
- [ ] Implement tracking logic
- [ ] Add persistence
- [ ] Test stats collection
- [ ] Test persistence

### 6.7 Performance Optimization

- [ ] Cache agent definitions:
  - [ ] Load once on first access
  - [ ] Invalidate on updates
  - [ ] Monitor memory usage

- [ ] Optimize instantiation:
  - [ ] Reuse agent instances when possible
  - [ ] Lazy-load extensions
  - [ ] Minimize file I/O

- [ ] Benchmarking:
  - [ ] Measure instantiation time
  - [ ] Measure lookup time
  - [ ] Identify bottlenecks
  - [ ] Optimize as needed

**Subtasks:**
- [ ] Implement caching
- [ ] Profile performance
- [ ] Optimize slow operations
- [ ] Test performance improvements

### 6.8 Testing & Verification

- [ ] Unit tests:
  - [ ] Factory creation
  - [ ] Permission checking
  - [ ] Configuration application
  - [ ] Error handling

- [ ] Integration tests:
  - [ ] Full spawn flow
  - [ ] Parent/child relationships
  - [ ] Permission enforcement
  - [ ] Usage tracking

- [ ] Performance tests:
  - [ ] Instantiation time < 100ms
  - [ ] Memory usage acceptable
  - [ ] Cache effectiveness

**Subtasks:**
- [ ] Write comprehensive tests
- [ ] Test all scenarios
- [ ] Performance benchmarking
- [ ] Fix any issues

**Estimated Time:** 5-6 days

---

## Phase 7: Testing & Documentation (Week 7-8)

### 7.1 Unit Test Coverage

- [ ] Test all new modules:
  - [ ] agent_registry: 95%+ coverage
  - [ ] agent_schema: 95%+ coverage
  - [ ] agent_versioning: 95%+ coverage
  - [ ] agent_instantiation: 95%+ coverage
  - [ ] All API endpoints: 90%+ coverage each

- [ ] Test data models:
  - [ ] AgentDefinition serialization/deserialization
  - [ ] Enum validation
  - [ ] Dataclass methods

- [ ] Test helpers:
  - [ ] Permission checking
  - [ ] Configuration merging
  - [ ] Error handling

**Subtasks:**
- [ ] Write unit tests
- [ ] Achieve coverage targets
- [ ] Run coverage reports
- [ ] Fix any gaps

### 7.2 Integration Tests

- [ ] Test complete flows:
  - [ ] Create agent → List → Get → Update → Delete
  - [ ] Create from chat → Refine → Save → Use
  - [ ] Spawn agent → Run → Track stats
  - [ ] Clone agent → Modify → Version → Rollback

- [ ] Test API sequences:
  - [ ] Multiple create operations
  - [ ] Concurrent operations
  - [ ] Error recovery

- [ ] Test UI workflows:
  - [ ] Tab switching
  - [ ] Create wizard completion
  - [ ] Edit and save
  - [ ] Delete with confirmation

**Subtasks:**
- [ ] Write integration tests
- [ ] Test multiple scenarios
- [ ] Test error cases
- [ ] Fix any issues

### 7.3 End-to-End Tests

- [ ] Full user journeys:
  - [ ] User creates agent via UI
  - [ ] User spawns agent from chat
  - [ ] Agent executes correctly
  - [ ] Stats are tracked

- [ ] Backward compatibility:
  - [ ] Old agents still work
  - [ ] Old tools still work
  - [ ] Old terminology understood
  - [ ] Migration successful

**Subtasks:**
- [ ] Write E2E tests
- [ ] Test complete workflows
- [ ] Test migrations
- [ ] Fix any issues

### 7.4 Code Quality Checks

- [ ] Linting:
  - [ ] Run pylint on all Python files
  - [ ] Run flake8 for style
  - [ ] Fix all violations

- [ ] Type checking:
  - [ ] Run mypy
  - [ ] Fix type errors
  - [ ] Add missing type hints

- [ ] Code formatting:
  - [ ] Run black formatter
  - [ ] Ensure consistent style
  - [ ] Run isort for imports

**Subtasks:**
- [ ] Run all linters
- [ ] Fix violations
- [ ] Run type checker
- [ ] Format code

### 7.5 Documentation

- [ ] API Documentation:
  - [ ] Document all endpoints
  - [ ] Include request/response examples
  - [ ] Document error codes
  - [ ] List all parameters

- [ ] User Guide:
  - [ ] How to create agents
  - [ ] How to manage agents
  - [ ] How to use agents in chat
  - [ ] Best practices

- [ ] Developer Guide:
  - [ ] Architecture overview
  - [ ] Component breakdown
  - [ ] Code organization
  - [ ] Extension points

- [ ] Examples:
  - [ ] 3-5 example agent definitions
  - [ ] Example workflows
  - [ ] Example API calls
  - [ ] Example UI interactions

**Subtasks:**
- [ ] Write API docs
- [ ] Write user guide
- [ ] Write developer guide
- [ ] Create examples
- [ ] Review and refine

### 7.6 Update Existing Documentation

- [ ] Update README:
  - [ ] Feature description
  - [ ] Quick start guide
  - [ ] Link to full docs

- [ ] Update architecture docs:
  - [ ] System diagram
  - [ ] Component overview
  - [ ] Data flow

- [ ] Update API docs:
  - [ ] All new endpoints
  - [ ] Request/response examples
  - [ ] Error handling

- [ ] Update user guide:
  - [ ] Feature overview
  - [ ] Usage instructions
  - [ ] Troubleshooting

**Subtasks:**
- [ ] Update all docs
- [ ] Review for accuracy
- [ ] Ensure consistency
- [ ] Proofread

### 7.7 Create Example Agents

- [ ] Create 3-5 example agents:
  - [ ] Code Review Agent
  - [ ] Research Assistant
  - [ ] Document Writer
  - [ ] API Designer
  - [ ] Customer Support Bot

- [ ] Each example includes:
  - [ ] Definition JSON
  - [ ] System prompt
  - [ ] Documented use cases
  - [ ] Example interactions

**Subtasks:**
- [ ] Design agents
- [ ] Create definitions
- [ ] Document examples
- [ ] Test examples

### 7.8 Create Migration Guide

- [ ] Document migration steps:
  - [ ] Backup existing setup
  - [ ] Run migration script
  - [ ] Verify results
  - [ ] Test old features

- [ ] Troubleshooting:
  - [ ] Common issues
  - [ ] Solutions
  - [ ] Support contacts

- [ ] Rollback procedure:
  - [ ] Steps to revert
  - [ ] Restore backup
  - [ ] Verify rollback

**Subtasks:**
- [ ] Write migration guide
- [ ] Document troubleshooting
- [ ] Document rollback
- [ ] Test procedures

### 7.9 Testing & Verification

- [ ] Final test pass:
  - [ ] Run all unit tests
  - [ ] Run all integration tests
  - [ ] Run E2E tests
  - [ ] Manual testing

- [ ] Code quality:
  - [ ] Linting passes
  - [ ] Type checking passes
  - [ ] Code coverage acceptable
  - [ ] No warnings

- [ ] Documentation:
  - [ ] All docs complete
  - [ ] Examples work
  - [ ] No broken links
  - [ ] Screenshots up to date

**Subtasks:**
- [ ] Run final tests
- [ ] Check code quality
- [ ] Verify documentation
- [ ] Fix any issues

### 7.10 Release Preparation

- [ ] Final checklist:
  - [ ] All tests pass
  - [ ] All code reviewed
  - [ ] All documentation complete
  - [ ] Release notes written

- [ ] Release notes:
  - [ ] Feature summary
  - [ ] Breaking changes
  - [ ] Migration instructions
  - [ ] Known issues
  - [ ] Contributors

- [ ] Version bumping:
  - [ ] Update version number
  - [ ] Update CHANGELOG.md
  - [ ] Tag release in git

**Subtasks:**
- [ ] Prepare release notes
- [ ] Update version numbers
- [ ] Create git tags
- [ ] Finalize release

**Estimated Time:** 6-8 days

---

## Post-Implementation

### After Phase 7 Completion

- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Gather user feedback
- [ ] Plan enhancements
- [ ] Document lessons learned

### Future Enhancements (Not in Initial Scope)

- [ ] Cloud-based agent sharing
- [ ] Agent marketplace
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] Agent templates and wizards
- [ ] Performance optimization
- [ ] Multi-tenant support
- [ ] Role-based access control

---

## Checklist Legend

- [ ] Not started
- [x] Completed
- [⚠️] In progress / Needs attention
- [~] Completed with notes

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Phases | 7 |
| Total Tasks | 300+ |
| Estimated Duration | 7-8 weeks |
| Files to Create | 25+ |
| Files to Modify | 40+ |
| Lines of Code | 5,000+ |
| Test Cases | 100+ |
| Documentation Pages | 50+ |

---

## Document Info

- **Version:** 1.0
- **Created:** January 20, 2024
- **Last Updated:** January 20, 2024
- **Status:** Ready for Implementation
- **Owner:** Development Team

---

**Use this checklist to track progress during implementation. Update status regularly and mark items as complete. If you encounter blockers or issues, document them and adjust timeline accordingly.**

