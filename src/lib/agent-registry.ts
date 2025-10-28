/**
 * Agent Registry - Manages custom agent definitions
 */

import type { CustomAgentDefinition } from '../../packages/agents/src/types';

const STORAGE_KEY = 'lumen_custom_agents';
const MAX_AGENTS = 100; // System limit for total agents
const MAX_CONCURRENT_PER_AGENT = 5; // Max concurrent tasks per agent

class AgentRegistry {
  private static instance: AgentRegistry;
  private customAgents: Map<string, CustomAgentDefinition>;

  private constructor() {
    this.customAgents = new Map();
    this.loadFromStorage();
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const agents = JSON.parse(stored) as CustomAgentDefinition[];
        agents.forEach(agent => this.customAgents.set(agent.id, agent));
      }
    } catch (error) {
      console.error('Failed to load custom agents:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const agents = Array.from(this.customAgents.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch (error) {
      console.error('Failed to save custom agents:', error);
    }
  }

  registerAgent(agent: CustomAgentDefinition): boolean {
    if (this.customAgents.size >= MAX_AGENTS) {
      throw new Error(`Cannot exceed ${MAX_AGENTS} total agents`);
    }

    if (this.customAgents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} already exists`);
    }

    // Validate and set defaults
    const normalizedAgent = {
      ...agent,
      maxConcurrentTasks: Math.min(
        agent.maxConcurrentTasks || 3,
        MAX_CONCURRENT_PER_AGENT
      )
    };

    this.customAgents.set(agent.id, normalizedAgent);
    this.saveToStorage();
    return true;
  }

  updateAgent(id: string, updates: Partial<CustomAgentDefinition>): boolean {
    const existing = this.customAgents.get(id);
    if (!existing) {
      throw new Error(`Agent ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
    };

    this.customAgents.set(id, updated);
    this.saveToStorage();
    return true;
  }

  deleteAgent(id: string): boolean {
    const deleted = this.customAgents.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getAgent(id: string): CustomAgentDefinition | undefined {
    return this.customAgents.get(id);
  }

  getAllAgents(): CustomAgentDefinition[] {
    return Array.from(this.customAgents.values());
  }

  getSystemLimits() {
    return {
      maxAgents: MAX_AGENTS,
      currentAgents: this.customAgents.size,
      maxConcurrentPerAgent: MAX_CONCURRENT_PER_AGENT,
      remainingSlots: MAX_AGENTS - this.customAgents.size
    };
  }
}

export const agentRegistry = AgentRegistry.getInstance();
