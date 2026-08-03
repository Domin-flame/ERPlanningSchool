/**
 * Service d'Attribute-Based Access Control (ABAC)
 * 
 * Ce service gère le contrôle d'accès granulaire basé sur les attributs des utilisateurs,
 * des ressources et du contexte d'exécution.
 */

export interface UserAttributes {
  id: number
  email: string
  role: string
  department?: string
  status: 'active' | 'inactive' | 'suspended'
  groups?: string[]
  permissions?: string[]
  createdAt?: Date
}

export interface ResourceAttributes {
  id: string
  owner: number
  type: 'course' | 'grade' | 'invoice' | 'document' | 'request'
  department?: string
  status: string
  visibility: 'public' | 'private' | 'department' | 'role'
  createdAt?: Date
}

export interface ContextAttributes {
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  location?: string
}

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'publish'
export type Effect = 'allow' | 'deny'

/**
 * Politique ABAC avec règles flexibles
 */
export interface AbacPolicy {
  id: string
  name: string
  effect: Effect
  actions: Action[]
  conditions: PolicyCondition[]
  priority: number
}

export interface PolicyCondition {
  attribute: string
  operator: 'equals' | 'contains' | 'startsWith' | 'greaterThan' | 'in' | 'exists'
  value: any
}

/**
 * Classe ABACEngine - Moteur d'évaluation ABAC
 */
export class ABACEngine {
  private policies: AbacPolicy[] = []

  constructor() {
    this.initializeDefaultPolicies()
  }

  /**
   * Initialiser les politiques par défaut
   */
  private initializeDefaultPolicies() {
    // Politiques de base pour les rôles
    this.policies = [
      // Super Admin - Accès total
      {
        id: 'super-admin-all',
        name: 'Super Admin Full Access',
        effect: 'allow',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'publish'],
        conditions: [{ attribute: 'user.role', operator: 'equals', value: 'Super Admin' }],
        priority: 100,
      },

      // Admin - Accès complet sauf suppression destructive
      {
        id: 'admin-manage',
        name: 'Admin Management Access',
        effect: 'allow',
        actions: ['view', 'create', 'edit', 'approve', 'publish'],
        conditions: [{ attribute: 'user.role', operator: 'equals', value: 'Admin' }],
        priority: 90,
      },

      // Staff - Accès limité à leur département
      {
        id: 'staff-department',
        name: 'Staff Department Access',
        effect: 'allow',
        actions: ['view', 'create', 'edit'],
        conditions: [
          { attribute: 'user.role', operator: 'equals', value: 'Staff' },
          {
            attribute: 'user.department',
            operator: 'equals',
            value: '$resource.department',
          },
        ],
        priority: 70,
      },

      // Student - Accès à leurs propres ressources
      {
        id: 'student-own',
        name: 'Student Own Resources',
        effect: 'allow',
        actions: ['view', 'edit'],
        conditions: [
          { attribute: 'user.role', operator: 'equals', value: 'Student' },
          { attribute: 'resource.owner', operator: 'equals', value: '$user.id' },
        ],
        priority: 50,
      },

      // Student - Accès aux ressources publiques
      {
        id: 'student-public',
        name: 'Student Public Access',
        effect: 'allow',
        actions: ['view'],
        conditions: [
          { attribute: 'user.role', operator: 'equals', value: 'Student' },
          { attribute: 'resource.visibility', operator: 'equals', value: 'public' },
        ],
        priority: 40,
      },

      // Student - Accès aux ressources de leur département
      {
        id: 'student-department',
        name: 'Student Department Access',
        effect: 'allow',
        actions: ['view'],
        conditions: [
          { attribute: 'user.role', operator: 'equals', value: 'Student' },
          { attribute: 'resource.visibility', operator: 'equals', value: 'department' },
          {
            attribute: 'user.department',
            operator: 'equals',
            value: '$resource.department',
          },
        ],
        priority: 45,
      },

      // Deny suspended users
      {
        id: 'deny-suspended',
        name: 'Deny Suspended Users',
        effect: 'deny',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'publish'],
        conditions: [{ attribute: 'user.status', operator: 'equals', value: 'suspended' }],
        priority: 200,
      },

      // Deny inactive users (except viewing)
      {
        id: 'deny-inactive-write',
        name: 'Deny Inactive Users Write Access',
        effect: 'deny',
        actions: ['create', 'edit', 'delete', 'approve', 'publish'],
        conditions: [{ attribute: 'user.status', operator: 'equals', value: 'inactive' }],
        priority: 150,
      },
    ]
  }

  /**
   * Évaluer si une action est autorisée
   */
  evaluate(
    action: Action,
    user: UserAttributes,
    resource: ResourceAttributes,
    context?: ContextAttributes
  ): boolean {
    // Fusionner les attributs
    const attributes = this.buildAttributeMap(user, resource, context)

    // Trier les politiques par priorité (du plus élevé au plus bas)
    const sortedPolicies = [...this.policies].sort((a, b) => b.priority - a.priority)

    // Évaluer chaque politique
    for (const policy of sortedPolicies) {
      // Vérifier si l'action correspond
      if (!policy.actions.includes(action)) continue

      // Évaluer les conditions
      const conditionsMet = this.evaluateConditions(policy.conditions, attributes)

      if (conditionsMet) {
        // Retourner le résultat (allow/deny)
        return policy.effect === 'allow'
      }
    }

    // Par défaut, refuser l'accès
    return false
  }

  /**
   * Construire une carte d'attributs fusionnée
   */
  private buildAttributeMap(
    user: UserAttributes,
    resource: ResourceAttributes,
    context?: ContextAttributes
  ): Record<string, any> {
    return {
      'user.id': user.id,
      'user.email': user.email,
      'user.role': user.role,
      'user.department': user.department,
      'user.status': user.status,
      'user.groups': user.groups,
      'resource.id': resource.id,
      'resource.owner': resource.owner,
      'resource.type': resource.type,
      'resource.department': resource.department,
      'resource.status': resource.status,
      'resource.visibility': resource.visibility,
      'context.timestamp': context?.timestamp,
      'context.ipAddress': context?.ipAddress,
    }
  }

  /**
   * Évaluer les conditions d'une politique
   */
  private evaluateConditions(
    conditions: PolicyCondition[],
    attributes: Record<string, any>
  ): boolean {
    // Toutes les conditions doivent être vraies (AND)
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, attributes)) {
        return false
      }
    }
    return true
  }

  /**
   * Évaluer une condition unique
   */
  private evaluateCondition(
    condition: PolicyCondition,
    attributes: Record<string, any>
  ): boolean {
    const attrValue = attributes[condition.attribute]

    // Gérer les références à d'autres attributs (ex: "$resource.department")
    let expectedValue = condition.value
    if (typeof expectedValue === 'string' && expectedValue.startsWith('$')) {
      const refAttr = expectedValue.substring(1)
      expectedValue = attributes[refAttr]
    }

    switch (condition.operator) {
      case 'equals':
        return attrValue === expectedValue
      case 'contains':
        return Array.isArray(attrValue) && attrValue.includes(expectedValue)
      case 'startsWith':
        return typeof attrValue === 'string' && attrValue.startsWith(expectedValue)
      case 'greaterThan':
        return Number(attrValue) > Number(expectedValue)
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(attrValue)
      case 'exists':
        return attrValue !== undefined && attrValue !== null
      default:
        return false
    }
  }

  /**
   * Ajouter une politique personnalisée
   */
  addPolicy(policy: AbacPolicy) {
    this.policies.push(policy)
  }

  /**
   * Lister toutes les politiques
   */
  getPolicies(): AbacPolicy[] {
    return [...this.policies]
  }
}

// Instance globale
export const abacEngine = new ABACEngine()

/**
 * Hook pour l'utilisation dans les composants React
 */
export function useAbac() {
  return {
    evaluate: (
      action: Action,
      user: UserAttributes,
      resource: ResourceAttributes
    ) => abacEngine.evaluate(action, user, resource),
    can: (action: Action, user: UserAttributes, resource: ResourceAttributes) =>
      abacEngine.evaluate(action, user, resource),
    cannot: (action: Action, user: UserAttributes, resource: ResourceAttributes) =>
      !abacEngine.evaluate(action, user, resource),
  }
}
