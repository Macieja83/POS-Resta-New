import { useState, useCallback } from 'react'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface FormErrors {
  [key: string]: string | null
}

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<FormErrors>({})

  const validateField = useCallback((name: string, value: string): string | null => {
    const rule = rules[name]
    if (!rule) return null

    if (rule.required && (!value || value.trim() === '')) {
      return 'To pole jest wymagane'
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      return `Minimum ${rule.minLength} znaków`
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      return `Maksimum ${rule.maxLength} znaków`
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      return 'Nieprawidłowy format'
    }

    if (value && rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [rules])

  const validateForm = useCallback((data: Record<string, string>): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field] || '')
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [rules, validateField])

  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    validateField,
    validateForm,
    setFieldError,
    clearErrors
  }
}




