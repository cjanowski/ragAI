import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({})

interface TabsProps extends React.ComponentPropsWithoutRef<"div"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<React.ElementRef<"div">, TabsProps>(
  ({ className, value, defaultValue, onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")
    const currentValue = value ?? internalValue

    const handleValueChange = React.useCallback((newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }, [value, onValueChange])

    return (
      <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn("w-full", className)} {...props} />
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  value: string
}

const TabsTrigger = React.forwardRef<React.ElementRef<"button">, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const isActive = context.value === value

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900",
          className
        )}
        onClick={() => context.onValueChange?.(value)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string
}

const TabsContent = React.forwardRef<React.ElementRef<"div">, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    
    if (context.value !== value) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }