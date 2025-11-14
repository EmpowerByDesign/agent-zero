# Orchestrator/Agents Feature - Component Breakdown

## Executive Summary

This document provides a detailed technical component breakdown for implementing the Orchestrator/Agents feature, organized by layer: **Data Models**, **Backend Services**, **API Endpoints**, **UI Components**, and **Tools/Utilities**.

---

## Part 1: Data Models & Schema

### 1.1 Agent Definition Schema

**File:** `/agent.py` and `/models.py` (new additions)

```python
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any, List
from datetime import datetime

class IsolationLevel(Enum):
    """Permission levels for agent isolation"""
    STRICT = "strict"           # No access to knowledge, memory, or sub-agents
    MODERATE = "moderate"       # Limited access (default)
    PERMISSIVE = "permissive"   # Full access

@dataclass
class ToolAccess:
    """Tool access configuration"""
    enabled: List[str] = field(default_factory=list)      # Whitelist
    disabled: List[str] = field(default_factory=list)     # Blacklist
    
    def is_allowed(self, tool_name: str) -> bool:
        if self.disabled and tool_name in self.disabled:
            return False
        if self.enabled and tool_name not in self.enabled:
            return False
        return True

@dataclass
class ModelOverride:
    """Optional per-agent model configuration"""
    provider: Optional[str] = None
    name: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    api_base: Optional[str] = None
    kwargs: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AgentDefinition:
    """Complete definition of a reusable agent"""
    
    # === IDENTIFICATION ===
    id: str                                          # Unique identifier
    name: str                                        # Display name
    description: str = ""                          # Long description
    version: str = "1.0.0"                          # Semantic version
    
    # === TIMESTAMPS & METADATA ===
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    created_by: str = "system"
    updated_by: str = "system"
    tags: List[str] = field(default_factory=list)
    
    # === BEHAVIOR ===
    system_prompt: str = ""                        # Primary system prompt
    instructions: str = ""                         # Additional instructions
    
    # === CONFIGURATION ===
    model_override: Optional[ModelOverride] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    context_window: Optional[int] = None
    
    # === TOOL & EXTENSION ACCESS ===
    tool_access: ToolAccess = field(default_factory=ToolAccess)
    extensions_enabled: List[str] = field(default_factory=list)
    
    # === PERMISSIONS ===
    allow_spawning_agents: bool = True
    allow_knowledge_access: bool = True
    allow_memory_access: bool = True
    isolation_level: IsolationLevel = IsolationLevel.MODERATE
    
    # === STATE ===
    is_active: bool = True
    parent_agent_id: Optional[str] = None          # If based on another
    custom_config: Dict[str, Any] = field(default_factory=dict)
    
    # === USAGE TRACKING ===
    spawn_count: int = 0
    last_spawned: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'version': self.version,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'created_by': self.created_by,
            'updated_by': self.updated_by,
            'tags': self.tags,
            'system_prompt': self.system_prompt,
            'instructions': self.instructions,
            'model_override': self.model_override.__dict__ if self.model_override else None,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'context_window': self.context_window,
            'tool_access': {
                'enabled': self.tool_access.enabled,
                'disabled': self.tool_access.disabled,
            },
            'extensions_enabled': self.extensions_enabled,
            'allow_spawning_agents': self.allow_spawning_agents,
            'allow_knowledge_access': self.allow_knowledge_access,
            'allow_memory_access': self.allow_memory_access,
            'isolation_level': self.isolation_level.value,
            'is_active': self.is_active,
            'parent_agent_id': self.parent_agent_id,
            'custom_config': self.custom_config,
            'spawn_count': self.spawn_count,
            'last_spawned': self.last_spawned.isoformat() if self.last_spawned else None,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AgentDefinition':
        """Create from JSON dict"""
        # Parse model override
        model_data = data.get('model_override')
        model_override = ModelOverride(**model_data) if model_data else None
        
        # Parse tool access
        tool_data = data.get('tool_access', {})
        tool_access = ToolAccess(
            enabled=tool_data.get('enabled', []),
            disabled=tool_data.get('disabled', []),
        )
        
        return cls(
            id=data['id'],
            name=data['name'],
            description=data.get('description', ''),
            version=data.get('version', '1.0.0'),
            created_at=datetime.fromisoformat(data['created_at']),
            updated_at=datetime.fromisoformat(data['updated_at']),
            created_by=data.get('created_by', 'system'),
            updated_by=data.get('updated_by', 'system'),
            tags=data.get('tags', []),
            system_prompt=data.get('system_prompt', ''),
            instructions=data.get('instructions', ''),
            model_override=model_override,
            temperature=data.get('temperature'),
            max_tokens=data.get('max_tokens'),
            context_window=data.get('context_window'),
            tool_access=tool_access,
            extensions_enabled=data.get('extensions_enabled', []),
            allow_spawning_agents=data.get('allow_spawning_agents', True),
            allow_knowledge_access=data.get('allow_knowledge_access', True),
            allow_memory_access=data.get('allow_memory_access', True),
            isolation_level=IsolationLevel(data.get('isolation_level', 'moderate')),
            is_active=data.get('is_active', True),
            parent_agent_id=data.get('parent_agent_id'),
            custom_config=data.get('custom_config', {}),
            spawn_count=data.get('spawn_count', 0),
            last_spawned=datetime.fromisoformat(data['last_spawned']) if data.get('last_spawned') else None,
        )
```

### 1.2 Agent Metadata Schema

**File:** `/python/helpers/agent_registry.py`

```python
@dataclass
class AgentMetadata:
    """Runtime metadata about an agent"""
    agent_id: str
    spawn_count: int = 0
    last_spawned: Optional[datetime] = None
    total_messages: int = 0
    average_response_time: float = 0.0
    error_count: int = 0
    last_error: Optional[str] = None
    usage_score: float = 0.0  # Relevance score for sorting
    
    def to_dict(self) -> Dict:
        return {
            'agent_id': self.agent_id,
            'spawn_count': self.spawn_count,
            'last_spawned': self.last_spawned.isoformat() if self.last_spawned else None,
            'total_messages': self.total_messages,
            'average_response_time': self.average_response_time,
            'error_count': self.error_count,
            'last_error': self.last_error,
            'usage_score': self.usage_score,
        }
```

---

## Part 2: Backend Services & Helpers

### 2.1 Agent Registry Service

**File:** `/python/helpers/agent_registry.py`

```python
import json
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
from agent import AgentDefinition, IsolationLevel

class AgentRegistry:
    """Central service for agent definition management"""
    
    AGENTS_DIR = Path(__file__).parent.parent.parent / "agents" / "custom-agents"
    
    @classmethod
    def ensure_dir(cls):
        """Ensure custom-agents directory exists"""
        cls.AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def load_agent(cls, agent_id: str) -> Optional[AgentDefinition]:
        """Load agent definition from disk"""
        cls.ensure_dir()
        definition_path = cls.AGENTS_DIR / agent_id / "_definition.json"
        
        if not definition_path.exists():
            return None
        
        with open(definition_path, 'r') as f:
            data = json.load(f)
        
        return AgentDefinition.from_dict(data)
    
    @classmethod
    def save_agent(cls, definition: AgentDefinition) -> bool:
        """Save agent definition to disk"""
        cls.ensure_dir()
        agent_dir = cls.AGENTS_DIR / definition.id
        agent_dir.mkdir(exist_ok=True)
        
        definition_path = agent_dir / "_definition.json"
        
        with open(definition_path, 'w') as f:
            json.dump(definition.to_dict(), f, indent=2)
        
        return True
    
    @classmethod
    def list_agents(cls, 
                   tags: Optional[List[str]] = None,
                   active_only: bool = True) -> List[AgentDefinition]:
        """List all available agents with optional filtering"""
        cls.ensure_dir()
        agents = []
        
        for agent_dir in cls.AGENTS_DIR.iterdir():
            if not agent_dir.is_dir():
                continue
            
            agent = cls.load_agent(agent_dir.name)
            if not agent:
                continue
            
            if active_only and not agent.is_active:
                continue
            
            if tags:
                if not any(tag in agent.tags for tag in tags):
                    continue
            
            agents.append(agent)
        
        # Sort by most recently used
        return sorted(agents, key=lambda a: a.last_spawned or a.created_at, reverse=True)
    
    @classmethod
    def delete_agent(cls, agent_id: str) -> bool:
        """Delete agent definition and associated files"""
        cls.ensure_dir()
        agent_dir = cls.AGENTS_DIR / agent_id
        
        if not agent_dir.exists():
            return False
        
        import shutil
        shutil.rmtree(agent_dir)
        return True
    
    @classmethod
    def agent_exists(cls, agent_id: str) -> bool:
        """Check if agent exists"""
        return (cls.AGENTS_DIR / agent_id / "_definition.json").exists()
    
    @classmethod
    def validate_agent_definition(cls, data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """Validate definition against schema"""
        errors = []
        
        # Required fields
        if not data.get('id'):
            errors.append("Agent ID is required")
        if not data.get('name'):
            errors.append("Agent name is required")
        if not data.get('system_prompt'):
            errors.append("System prompt is required")
        
        # Field validations
        if 'temperature' in data and data['temperature'] is not None:
            if not 0 <= data['temperature'] <= 1:
                errors.append("Temperature must be between 0 and 1")
        
        if 'isolation_level' in data:
            valid_levels = [e.value for e in IsolationLevel]
            if data['isolation_level'] not in valid_levels:
                errors.append(f"Invalid isolation level. Must be one of: {valid_levels}")
        
        return len(errors) == 0, errors
```

### 2.2 Agent Schema Validator

**File:** `/python/helpers/agent_schema.py`

```python
from jsonschema import validate, ValidationError, Draft7Validator
from typing import Dict, Any, Tuple, List

AGENT_DEFINITION_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["id", "name", "system_prompt"],
    "properties": {
        "id": {"type": "string", "pattern": "^[a-z0-9-]+$"},
        "name": {"type": "string", "minLength": 1},
        "description": {"type": "string"},
        "version": {"type": "string"},
        "system_prompt": {"type": "string"},
        "instructions": {"type": "string"},
        "tags": {"type": "array", "items": {"type": "string"}},
        "temperature": {"type": ["number", "null"], "minimum": 0, "maximum": 1},
        "max_tokens": {"type": ["integer", "null"], "minimum": 1},
        "tool_access": {
            "type": "object",
            "properties": {
                "enabled": {"type": "array", "items": {"type": "string"}},
                "disabled": {"type": "array", "items": {"type": "string"}},
            }
        },
        "isolation_level": {"type": "string", "enum": ["strict", "moderate", "permissive"]},
        "is_active": {"type": "boolean"},
    }
}

class AgentSchemaValidator:
    """Validate agent definitions against schema"""
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate data against schema"""
        errors = []
        try:
            validate(instance=data, schema=AGENT_DEFINITION_SCHEMA)
            return True, []
        except ValidationError as e:
            errors.append(str(e.message))
            return False, errors
    
    @staticmethod
    def get_schema() -> Dict:
        """Return the schema for UI generation"""
        return AGENT_DEFINITION_SCHEMA
```

### 2.3 Agent Versioning System

**File:** `/python/helpers/agent_versioning.py`

```python
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict
from agent import AgentDefinition

class AgentVersionControl:
    """Manage agent definition versions"""
    
    @staticmethod
    def create_version(definition: AgentDefinition, 
                      change_summary: str = "") -> str:
        """Create and save a new version"""
        agent_dir = Path(__file__).parent.parent.parent / "agents" / "custom-agents" / definition.id
        versions_dir = agent_dir / "_versions"
        versions_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version_file = versions_dir / f"v{definition.version}_{timestamp}.json"
        
        version_data = {
            **definition.to_dict(),
            'change_summary': change_summary,
            'timestamp': timestamp,
        }
        
        with open(version_file, 'w') as f:
            json.dump(version_data, f, indent=2)
        
        return version_file.name
    
    @staticmethod
    def get_version_history(agent_id: str) -> List[Dict]:
        """Get version history"""
        agent_dir = Path(__file__).parent.parent.parent / "agents" / "custom-agents" / agent_id
        versions_dir = agent_dir / "_versions"
        
        if not versions_dir.exists():
            return []
        
        versions = []
        for version_file in sorted(versions_dir.glob("v*.json"), reverse=True):
            with open(version_file, 'r') as f:
                data = json.load(f)
            
            versions.append({
                'file': version_file.name,
                'version': data.get('version'),
                'timestamp': data.get('timestamp'),
                'change_summary': data.get('change_summary', ''),
                'updated_by': data.get('updated_by', 'unknown'),
            })
        
        return versions
    
    @staticmethod
    def rollback_to_version(agent_id: str, version_file: str) -> Optional[AgentDefinition]:
        """Restore agent to previous version"""
        agent_dir = Path(__file__).parent.parent.parent / "agents" / "custom-agents" / agent_id
        version_path = agent_dir / "_versions" / version_file
        
        if not version_path.exists():
            return None
        
        with open(version_path, 'r') as f:
            data = json.load(f)
        
        # Create new current version from rollback
        definition = AgentDefinition.from_dict(data)
        return definition
```

### 2.4 Agent Instantiation Factory

**File:** `/python/helpers/agent_instantiation.py`

```python
import copy
from agent import Agent, AgentConfig, AgentDefinition
import models

class AgentFactory:
    """Create Agent instances from AgentDefinition"""
    
    @staticmethod
    def create_from_definition(parent_agent: Agent,
                              definition: AgentDefinition,
                              config_override: Optional[dict] = None) -> Agent:
        """Instantiate Agent from AgentDefinition"""
        
        # Validate permissions
        if not AgentFactory._check_permission(parent_agent, definition):
            raise PermissionError(
                f"Parent agent lacks permission to spawn '{definition.id}'"
            )
        
        # Copy parent config as base
        config = copy.deepcopy(parent_agent.config)
        
        # Apply definition model settings
        if definition.model_override:
            override = definition.model_override
            if override.provider and override.name:
                config.chat_model = models.ModelConfig(
                    type=models.ModelType.CHAT,
                    provider=override.provider,
                    name=override.name,
                    api_base=override.api_base or "",
                    ctx_length=override.max_tokens or 0,
                    kwargs=override.kwargs or {},
                )
        
        # Apply temperature and token settings
        if definition.temperature is not None:
            config.chat_model.temperature = definition.temperature
        if definition.max_tokens:
            config.chat_model.max_tokens = definition.max_tokens
        
        # Apply config overrides
        if config_override:
            for key, value in config_override.items():
                if hasattr(config, key):
                    setattr(config, key, value)
        
        # Create agent instance
        agent = Agent(
            parent_agent.number + 1,
            config,
            parent_agent.context
        )
        
        # Set relationships
        agent.set_data(Agent.DATA_NAME_PARENT, parent_agent)
        agent.set_data("definition_id", definition.id)
        agent.set_data("isolation_level", definition.isolation_level.value)
        
        # Set system prompt
        agent.system_prompt = definition.system_prompt
        if definition.instructions:
            agent.set_data("instructions", definition.instructions)
        
        # Apply tool restrictions
        config.additional["tool_access"] = {
            "enabled": definition.tool_access.enabled,
            "disabled": definition.tool_access.disabled,
        }
        
        # Apply extension configuration
        if definition.extensions_enabled:
            config.additional["extensions_enabled"] = definition.extensions_enabled
        
        return agent
    
    @staticmethod
    def _check_permission(parent: Agent, definition: AgentDefinition) -> bool:
        """Check if parent can spawn this agent"""
        
        # Check parent's permission to spawn agents
        parent_isolation = parent.get_data("isolation_level", "moderate")
        if parent_isolation == "strict":
            return False
        
        # Check if agent itself is active
        if not definition.is_active:
            return False
        
        # Check parent isolation vs. agent isolation requirements
        if definition.isolation_level.value == "permissive":
            # Only moderate/permissive parents can spawn permissive agents
            if parent_isolation == "strict":
                return False
        
        return True
```

---

## Part 3: API Endpoints

### 3.1 Endpoint Files Structure

All endpoint files follow this pattern:

**File:** `/python/api/agents_[action].py`

```python
from python.helpers.api import ApiHandler, Request, Response
from python.helpers.agent_registry import AgentRegistry
from python.helpers.agent_schema import AgentSchemaValidator
from agent import AgentDefinition
from typing import Dict, Any

class AgentAction(ApiHandler):
    """API endpoint for agent operations"""
    
    async def process(self, input: Dict[str, Any], request: Request) -> Response:
        """Process API request"""
        try:
            # Implement specific action
            result = await self.execute(input, request)
            return self.success_response(result)
        except Exception as e:
            return self.error_response(str(e))
    
    async def execute(self, input: Dict[str, Any], request: Request) -> Dict:
        """Implement action-specific logic"""
        raise NotImplementedError
    
    def success_response(self, data: Any) -> Response:
        """Format successful response"""
        return Response({"status": "success", **data})
    
    def error_response(self, message: str) -> Response:
        """Format error response"""
        return Response({"status": "error", "message": message})
```

### 3.2 Endpoint List

| Endpoint | Method | File | Purpose |
|----------|--------|------|---------|
| `/api/agents/list` | GET | `agents_list.py` | List all agents with filtering |
| `/api/agents/{agent_id}` | GET | `agents_get.py` | Get specific agent definition |
| `/api/agents/create` | POST | `agents_create.py` | Create new agent |
| `/api/agents/{agent_id}/update` | PUT | `agents_update.py` | Update agent definition |
| `/api/agents/{agent_id}/delete` | DELETE | `agents_delete.py` | Delete agent |
| `/api/agents/{agent_id}/clone` | POST | `agents_clone.py` | Create copy of agent |
| `/api/agents/test` | POST | `agents_test.py` | Test agent with sample message |
| `/api/agents/{agent_id}/versions` | GET | `agent_versions_list.py` | List version history |
| `/api/agents/{agent_id}/rollback` | POST | `agent_versions_rollback.py` | Restore previous version |

### 3.3 Sample Endpoint Implementation

**File:** `/python/api/agents_create.py`

```python
from python.helpers.api import ApiHandler, Request, Response
from python.helpers.agent_registry import AgentRegistry
from python.helpers.agent_schema import AgentSchemaValidator
from agent import AgentDefinition, ToolAccess, ModelOverride, IsolationLevel
from datetime import datetime
from typing import Dict, Any

class AgentCreate(ApiHandler):
    
    async def process(self, input: Dict[str, Any], request: Request) -> Response:
        try:
            # Get JSON data
            data = request.get_json()
            
            # Validate required fields
            if not data.get('id') or not data.get('name'):
                raise ValueError("Agent ID and name are required")
            
            # Validate against schema
            valid, errors = AgentSchemaValidator.validate(data)
            if not valid:
                raise ValueError(f"Validation failed: {', '.join(errors)}")
            
            # Check if agent already exists
            if AgentRegistry.agent_exists(data['id']):
                raise ValueError(f"Agent with ID '{data['id']}' already exists")
            
            # Create definition
            definition = self._build_definition(data)
            
            # Save to disk
            AgentRegistry.save_agent(definition)
            
            return Response({
                "status": "success",
                "agent_id": definition.id,
                "agent": definition.to_dict()
            })
        
        except Exception as e:
            return Response({"status": "error", "message": str(e)})
    
    def _build_definition(self, data: Dict) -> AgentDefinition:
        """Build AgentDefinition from request data"""
        
        # Parse model override if provided
        model_data = data.get('model_override')
        model_override = None
        if model_data:
            model_override = ModelOverride(
                provider=model_data.get('provider'),
                name=model_data.get('name'),
                temperature=model_data.get('temperature'),
                max_tokens=model_data.get('max_tokens'),
            )
        
        # Parse tool access
        tool_data = data.get('tool_access', {})
        tool_access = ToolAccess(
            enabled=tool_data.get('enabled', []),
            disabled=tool_data.get('disabled', []),
        )
        
        return AgentDefinition(
            id=data['id'],
            name=data['name'],
            description=data.get('description', ''),
            version=data.get('version', '1.0.0'),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            system_prompt=data['system_prompt'],
            instructions=data.get('instructions', ''),
            model_override=model_override,
            temperature=data.get('temperature'),
            max_tokens=data.get('max_tokens'),
            tool_access=tool_access,
            extensions_enabled=data.get('extensions_enabled', []),
            allow_spawning_agents=data.get('allow_spawning_agents', True),
            allow_knowledge_access=data.get('allow_knowledge_access', True),
            allow_memory_access=data.get('allow_memory_access', True),
            isolation_level=IsolationLevel(data.get('isolation_level', 'moderate')),
            is_active=data.get('is_active', True),
            tags=data.get('tags', []),
        )
```

---

## Part 4: UI Components

### 4.1 Component Structure

**Naming Convention:** `/webui/components/settings/agents-[component].html`

```
agents-list.html          # Main agents list view
agents-detail.html        # Agent details/preview
agents-create.html        # Create agent wizard
agents-edit.html          # Edit existing agent
agents-toolbar.html       # Search, filter, sort toolbar
agents-actions-menu.html  # Context menu for agent actions
spawn-agent-modal.html    # Dialog for spawning agents
```

### 4.2 Main Agents List Component

**File:** `/webui/components/settings/agents-list.html`

```html
<div class="agents-container" x-data="agentsManager()">
    <!-- Toolbar -->
    <div class="agents-toolbar">
        <input type="text" 
               x-model="searchQuery"
               @input="filterAgents()"
               placeholder="Search agents..." 
               class="search-input">
        
        <select x-model="selectedTag" @change="filterAgents()" class="filter-select">
            <option value="">All Tags</option>
            <template x-for="tag in allTags">
                <option :value="tag" x-text="tag"></option>
            </template>
        </select>
        
        <label class="checkbox-label">
            <input type="checkbox" x-model="showInactiveOnly" @change="filterAgents()">
            Show Only Active
        </label>
        
        <button @click="openCreateForm()" class="btn btn-primary">
            + Create Agent
        </button>
    </div>
    
    <!-- Agents List -->
    <div class="agents-list">
        <table class="agents-table">
            <thead>
                <tr>
                    <th @click="sortBy('name')">Name 
                        <span x-show="sortField === 'name'">
                            <span x-show="sortDirection === 'asc'">↑</span>
                            <span x-show="sortDirection === 'desc'">↓</span>
                        </span>
                    </th>
                    <th>Description</th>
                    <th>Tags</th>
                    <th>Version</th>
                    <th>Last Used</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <template x-for="agent in filteredAgents" :key="agent.id">
                    <tr class="agent-row" @click="selectAgent(agent)">
                        <td><strong x-text="agent.name"></strong></td>
                        <td x-text="agent.description.substring(0, 50) + '...'"></td>
                        <td>
                            <span class="tag" x-for="tag in agent.tags" 
                                  x-text="tag"></span>
                        </td>
                        <td x-text="agent.version"></td>
                        <td x-text="formatDate(agent.last_spawned)"></td>
                        <td>
                            <div class="action-menu">
                                <button @click.stop="showActions(agent)" class="btn-menu">⋮</button>
                                <div x-show="selectedAgent?.id === agent.id" class="dropdown-menu">
                                    <button @click="editAgent(agent)">✎ Edit</button>
                                    <button @click="cloneAgent(agent)">↻ Clone</button>
                                    <button @click="testAgent(agent)">▶ Test</button>
                                    <button @click="showStats(agent)">📊 Stats</button>
                                    <button @click="deleteAgent(agent)" class="danger">🗑 Delete</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
        
        <div x-show="filteredAgents.length === 0" class="empty-state">
            <p>No agents found. Create one to get started!</p>
        </div>
    </div>
    
    <!-- Details Panel -->
    <div x-show="selectedAgent" class="agent-details-panel">
        <div class="panel-header">
            <h3 x-text="selectedAgent?.name"></h3>
            <button @click="selectedAgent = null" class="btn-close">✕</button>
        </div>
        <div class="panel-body">
            <p x-text="selectedAgent?.description"></p>
            <dl>
                <dt>Version:</dt>
                <dd x-text="selectedAgent?.version"></dd>
                <dt>Created:</dt>
                <dd x-text="formatDate(selectedAgent?.created_at)"></dd>
                <dt>Isolation Level:</dt>
                <dd x-text="selectedAgent?.isolation_level"></dd>
                <dt>Can Spawn Agents:</dt>
                <dd x-text="selectedAgent?.allow_spawning_agents ? 'Yes' : 'No'"></dd>
            </dl>
        </div>
    </div>
</div>

<script>
function agentsManager() {
    return {
        agents: [],
        filteredAgents: [],
        selectedAgent: null,
        searchQuery: '',
        selectedTag: '',
        showInactiveOnly: true,
        sortField: 'name',
        sortDirection: 'asc',
        allTags: [],
        
        async init() {
            await this.loadAgents();
            this.extractTags();
        },
        
        async loadAgents() {
            const response = await fetch('/api/agents/list');
            const data = await response.json();
            this.agents = data.agents;
            this.filteredAgents = [...this.agents];
        },
        
        filterAgents() {
            let filtered = [...this.agents];
            
            if (this.searchQuery) {
                filtered = filtered.filter(a => 
                    a.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    a.description.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
            
            if (this.selectedTag) {
                filtered = filtered.filter(a => a.tags.includes(this.selectedTag));
            }
            
            if (this.showInactiveOnly) {
                filtered = filtered.filter(a => a.is_active);
            }
            
            this.filteredAgents = filtered;
        },
        
        sortBy(field) {
            if (this.sortField === field) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortField = field;
                this.sortDirection = 'asc';
            }
            
            this.filteredAgents.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return this.sortDirection === 'asc' ? cmp : -cmp;
            });
        },
        
        selectAgent(agent) {
            this.selectedAgent = agent;
        },
        
        openCreateForm() {
            // Open create agent modal
            window.openModal('settings/agents/agents-create.html');
        },
        
        editAgent(agent) {
            // Load edit form with agent data
            window.editAgent(agent);
        },
        
        async deleteAgent(agent) {
            if (!confirm(`Delete agent "${agent.name}"?`)) return;
            
            const response = await fetch(`/api/agents/${agent.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await this.loadAgents();
                this.selectedAgent = null;
            }
        },
        
        formatDate(dateStr) {
            if (!dateStr) return 'Never';
            return new Date(dateStr).toLocaleDateString();
        },
        
        extractTags() {
            const tagSet = new Set();
            this.agents.forEach(a => a.tags.forEach(t => tagSet.add(t)));
            this.allTags = Array.from(tagSet);
        }
    }
}
</script>
```

### 4.3 Create Agent Component

**File:** `/webui/components/settings/agents-create.html` (excerpt)

```html
<div class="modal-dialog agents-create-modal" x-data="agentCreateForm()">
    <!-- Multi-step wizard -->
    <div class="wizard">
        <!-- Step 1: Basic Info -->
        <div class="wizard-step" x-show="currentStep === 1">
            <h2>Create New Agent - Step 1/5: Basic Information</h2>
            <div class="form-group">
                <label>Agent ID (machine name)</label>
                <input type="text" x-model="form.id" 
                       @input="validateAgentId()"
                       placeholder="e.g., code-reviewer">
                <small x-show="idError" class="error" x-text="idError"></small>
            </div>
            <div class="form-group">
                <label>Display Name</label>
                <input type="text" x-model="form.name" placeholder="e.g., Code Reviewer">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea x-model="form.description" 
                          placeholder="What does this agent do?"></textarea>
            </div>
            <div class="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" x-model="tagsInput" 
                       @blur="parseTags()"
                       placeholder="e.g., code, review, python">
            </div>
        </div>
        
        <!-- Step 2: Functionality -->
        <div class="wizard-step" x-show="currentStep === 2">
            <h2>Step 2/5: Functionality</h2>
            <h3>Select Enabled Tools</h3>
            <div class="tool-checklist">
                <template x-for="tool in availableTools">
                    <label class="checkbox-label">
                        <input type="checkbox" 
                               :value="tool"
                               x-model="form.tool_access.enabled">
                        <span x-text="tool"></span>
                    </label>
                </template>
            </div>
        </div>
        
        <!-- Step 3: Behavior -->
        <div class="wizard-step" x-show="currentStep === 3">
            <h2>Step 3/5: Behavior Settings</h2>
            <div class="form-group">
                <label>System Prompt</label>
                <textarea x-model="form.system_prompt" 
                          class="prompt-editor"
                          rows="10"></textarea>
            </div>
            <div class="form-group">
                <label>Temperature (creativity)</label>
                <input type="range" x-model.number="form.temperature" 
                       min="0" max="1" step="0.1">
                <span x-text="form.temperature.toFixed(1)"></span>
            </div>
        </div>
        
        <!-- Step 4: Permissions -->
        <div class="wizard-step" x-show="currentStep === 4">
            <h2>Step 4/5: Permissions & Isolation</h2>
            <div class="form-group">
                <label>Isolation Level</label>
                <select x-model="form.isolation_level">
                    <option value="strict">Strict (no access to knowledge/memory)</option>
                    <option value="moderate">Moderate (limited access)</option>
                    <option value="permissive">Permissive (full access)</option>
                </select>
            </div>
            <div class="checkbox-group">
                <label>
                    <input type="checkbox" x-model="form.allow_spawning_agents">
                    Allow this agent to spawn sub-agents
                </label>
                <label>
                    <input type="checkbox" x-model="form.allow_knowledge_access">
                    Allow knowledge base access
                </label>
                <label>
                    <input type="checkbox" x-model="form.allow_memory_access">
                    Allow memory access
                </label>
            </div>
        </div>
        
        <!-- Step 5: Review -->
        <div class="wizard-step" x-show="currentStep === 5">
            <h2>Step 5/5: Review & Confirm</h2>
            <div class="review-section">
                <h3>Agent Summary</h3>
                <dl>
                    <dt>Name:</dt>
                    <dd x-text="form.name"></dd>
                    <dt>ID:</dt>
                    <dd x-text="form.id"></dd>
                    <dt>Tools Enabled:</dt>
                    <dd x-text="form.tool_access.enabled.join(', ')"></dd>
                    <dt>Isolation:</dt>
                    <dd x-text="form.isolation_level"></dd>
                </dl>
                <h3>System Prompt Preview</h3>
                <pre x-text="form.system_prompt.substring(0, 200) + '...'"></pre>
            </div>
        </div>
        
        <!-- Navigation -->
        <div class="wizard-nav">
            <button @click="previousStep()" :disabled="currentStep === 1">← Back</button>
            <span x-text="`Step ${currentStep} of 5`"></span>
            <button @click="nextStep()" :disabled="currentStep === 5">Next →</button>
            <button @click="createAgent()" x-show="currentStep === 5" class="btn-primary">
                Create Agent
            </button>
        </div>
    </div>
</div>
```

---

## Part 5: Tools & Utilities

### 5.1 Updated spawn_agent Tool

**File:** `/python/tools/spawn_agent.py` (renamed from `call_subordinate.py`)

```python
from agent import Agent, UserMessage
from python.helpers.tool import Tool, Response
from python.helpers.agent_registry import AgentRegistry
from python.helpers.agent_instantiation import AgentFactory
from initialize import initialize_agent
from datetime import datetime
import json

class SpawnAgent(Tool):
    """
    Spawn a new agent instance from a saved definition
    
    Parameters:
      agent_id (str): ID of agent definition to instantiate
      message (str): Initial message for the spawned agent
      reset (bool): Force create new instance (vs. reuse existing)
      config_override (dict): Optional configuration overrides
    """
    
    async def execute(self, agent_id: str = "", message: str = "", 
                     reset: str = "", config_override: dict = None, **kwargs):
        
        # Validate agent_id
        if not agent_id:
            return Response(message="Error: agent_id is required", break_loop=True)
        
        # Load agent definition
        definition = AgentRegistry.load_agent(agent_id)
        if not definition:
            return Response(
                message=f"Error: Agent '{agent_id}' not found",
                break_loop=True
            )
        
        # Check permissions
        if not self.agent.get_data("allow_spawning_agents", True):
            return Response(
                message=f"Error: Your agent cannot spawn sub-agents",
                break_loop=True
            )
        
        # Determine if we should reuse or create new
        reuse_key = f"agent_{agent_id}"
        spawned_agent = None
        
        if reset.lower() != "true":
            spawned_agent = self.agent.get_data(reuse_key)
        
        if not spawned_agent:
            try:
                # Create new agent from definition
                spawned_agent = AgentFactory.create_from_definition(
                    self.agent,
                    definition,
                    config_override
                )
                self.agent.set_data(reuse_key, spawned_agent)
            except Exception as e:
                return Response(message=f"Error creating agent: {str(e)}", break_loop=True)
        
        # Add user message
        spawned_agent.hist_add_user_message(UserMessage(message=message, attachments=[]))
        
        # Run spawned agent
        try:
            result = await spawned_agent.monologue()
        except Exception as e:
            return Response(message=f"Error running spawned agent: {str(e)}", break_loop=True)
        
        # Update usage stats
        definition.spawn_count += 1
        definition.last_spawned = datetime.now()
        AgentRegistry.save_agent(definition)
        
        return Response(message=result, break_loop=False)
    
    def get_log_object(self):
        return self.agent.context.log.log(
            type="tool",
            heading=f"icon://communication {self.agent.agent_name}: Spawning Agent",
            content="",
            kvps=self.args,
        )
```

### 5.2 Agent Prompt Variable Plugin

**File:** `/prompts/agents.system.tool.spawn_agent.py`

```python
from typing import Any
from python.helpers.files import VariablesPlugin
from python.helpers.agent_registry import AgentRegistry

class SpawnAgentVariables(VariablesPlugin):
    """Provide dynamic variables for spawn_agent tool prompt"""
    
    def get_variables(self, file: str, backup_dirs: list[str] | None = None) -> dict[str, Any]:
        
        # Load all available agents
        agents = AgentRegistry.list_agents(active_only=True)
        
        # Format as list for prompt
        agent_list = [
            {
                "id": agent.id,
                "name": agent.name,
                "description": agent.description,
                "tags": agent.tags,
                "isolation_level": agent.isolation_level.value,
            }
            for agent in agents
        ]
        
        return {
            "available_agents": agent_list,
            "agent_count": len(agent_list),
        }
```

---

## Part 6: Integration Points

### 6.1 Agent Class Modifications

**File:** `/agent.py` (modifications)

```python
# Add new data storage keys
class Agent:
    DATA_NAME_PARENT = "parent"              # Replaces DATA_NAME_SUPERIOR
    DATA_NAME_AGENT = "agent"                # Replaces DATA_NAME_SUBORDINATE
    DATA_NAME_DEFINITION_ID = "definition_id"
    DATA_NAME_ISOLATION_LEVEL = "isolation_level"
    
    # ... existing code ...
    
    def can_spawn_agents(self) -> bool:
        """Check if this agent can spawn sub-agents"""
        isolation = self.get_data("isolation_level", "moderate")
        return isolation != "strict"
    
    def get_parent_agent(self) -> 'Agent | None':
        """Get parent agent if exists"""
        return self.get_data(self.DATA_NAME_PARENT)
    
    def is_isolated(self) -> bool:
        """Check if agent is in strict isolation"""
        isolation = self.get_data("isolation_level", "moderate")
        return isolation == "strict"
```

### 6.2 Flask API Integration

**File:** `/run_ui.py` (modifications to add new routes)

```python
# Add agent routes
from python.api import (
    agents_list,
    agents_get,
    agents_create,
    agents_update,
    agents_delete,
    agents_clone,
    agents_test,
    agent_versions_list,
    agent_versions_rollback,
)

# Register endpoints
app.add_api_handler('/agents/list', agents_list.AgentsList)
app.add_api_handler('/agents/<agent_id>', agents_get.AgentsGet)
app.add_api_handler('/agents/create', agents_create.AgentCreate, methods=['POST'])
app.add_api_handler('/agents/<agent_id>/update', agents_update.AgentsUpdate, methods=['PUT'])
app.add_api_handler('/agents/<agent_id>/delete', agents_delete.AgentsDelete, methods=['DELETE'])
# ... etc
```

### 6.3 UI Tab Integration

**File:** `/webui/index.html` (modifications)

```html
<!-- Add Agents tab to sidebar -->
<div class="tabs-container">
    <div class="tabs">
        <div class="tab active" id="chats-tab">Chats</div>
        <div class="tab" id="tasks-tab">Tasks</div>
        <div class="tab" id="agents-tab">Agents</div>  <!-- NEW -->
    </div>
</div>

<!-- Add Agents section -->
<div id="agents-section" class="config-section" style="display: none;">
    <div id="agents-container"></div>
</div>

<script>
document.getElementById('agents-tab').addEventListener('click', function() {
    loadAgentsTab();
});

async function loadAgentsTab() {
    const container = document.getElementById('agents-container');
    const response = await fetch('components/settings/agents-list.html');
    container.innerHTML = await response.text();
    Alpine.scan(container);
}
</script>
```

---

## Conclusion

This component breakdown provides the technical foundation for implementing the Orchestrator/Agents feature. Each section can be implemented incrementally, starting with the data models and proceeding through backend services, APIs, and finally UI components.

Key implementation priorities:
1. **Phase 1:** Data models and validation
2. **Phase 2:** Storage and retrieval layer
3. **Phase 3:** API endpoints
4. **Phase 4:** Agent instantiation
5. **Phase 5:** UI components
6. **Phase 6:** Integration and testing

