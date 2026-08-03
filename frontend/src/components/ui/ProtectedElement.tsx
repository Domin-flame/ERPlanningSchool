import React from 'react'
import { abacEngine, Action, ResourceAttributes, UserAttributes } from '@/services/abac.service'

interface ProtectedElementProps {
  action: Action
  user: UserAttributes
  resource: ResourceAttributes
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Composant qui contrôle l'affichage d'un élément basé sur ABAC
 */
export function ProtectedElement({
  action,
  user,
  resource,
  children,
  fallback = null,
}: ProtectedElementProps) {
  const isAllowed = abacEngine.evaluate(action, user, resource)
  return isAllowed ? <>{children}</> : <>{fallback}</>
}

interface ProtectedButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'resource'> {
  action: Action
  user: UserAttributes
  resource: ResourceAttributes
  children: React.ReactNode
}

/**
 * Bouton protégé par ABAC - s'affiche que si l'action est autorisée
 */
export function ProtectedButton({
  action,
  user,
  resource,
  children,
  disabled,
  ...props
}: ProtectedButtonProps) {
  const isAllowed = abacEngine.evaluate(action, user, resource)

  if (!isAllowed) return null

  return (
    <button disabled={disabled || !isAllowed} {...props}>
      {children}
    </button>
  )
}

interface ProtectedDivProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'resource'> {
  action: Action
  user: UserAttributes
  resource: ResourceAttributes
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Section protégée par ABAC
 */
export function ProtectedSection({
  action,
  user,
  resource,
  children,
  fallback = null,
  ...props
}: ProtectedDivProps) {
  const isAllowed = abacEngine.evaluate(action, user, resource)
  return (
    <div {...props}>
      {isAllowed ? children : fallback}
    </div>
  )
}
