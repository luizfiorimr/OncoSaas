'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(
  undefined
);

interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', defaultValue, className, children, ...props }, ref) => {
    const [openItems, setOpenItems] = React.useState<string[]>(() => {
      if (defaultValue) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const toggleItem = React.useCallback(
      (value: string) => {
        setOpenItems((prev) => {
          if (type === 'single') {
            return prev.includes(value) ? [] : [value];
          }
          return prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value];
        });
      },
      [type]
    );

    return (
      <AccordionContext.Provider value={{ openItems, toggleItem }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = 'Accordion';

interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionItem must be used within Accordion');
    }

    const isOpen = context.openItems.includes(value);

    return (
      <CollapsiblePrimitive.Root
        ref={ref}
        open={isOpen}
        onOpenChange={() => context.toggleItem(value)}
        className={cn('border-b', className)}
        {...props}
      >
        {children}
      </CollapsiblePrimitive.Root>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> {
  className?: string;
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => {
  return (
    <div className="flex">
      <CollapsiblePrimitive.Trigger
        ref={ref}
        className={cn(
          'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </CollapsiblePrimitive.Trigger>
    </div>
  );
});
AccordionTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> {
  className?: string;
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => {
  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </CollapsiblePrimitive.Content>
  );
});

AccordionContent.displayName = CollapsiblePrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
