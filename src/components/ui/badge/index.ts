import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
         "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        success:
          "border-transparent bg-success text-success-foreground [a&]:hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        hp: "border-transparent bg-sphere-hp text-sphere-hp-foreground [a&]:hover:bg-sphere-hp/90",
        mp: "border-transparent bg-sphere-mp text-sphere-mp-foreground [a&]:hover:bg-sphere-mp/90",
        strength: "border-transparent bg-sphere-strength text-sphere-strength-foreground [a&]:hover:bg-sphere-strength/90",
        defense: "border-transparent bg-sphere-defense text-sphere-defense-foreground [a&]:hover:bg-sphere-defense/90",
        magic: "border-transparent bg-sphere-magic text-sphere-magic-foreground [a&]:hover:bg-sphere-magic/90",
        magicDef: "border-transparent bg-sphere-magicDef text-sphere-magicDef-foreground [a&]:hover:bg-sphere-magicDef/90",
        agility: "border-transparent bg-sphere-agility text-sphere-agility-foreground [a&]:hover:bg-sphere-agility/90",
        accuracy: "border-transparent bg-sphere-accuracy text-sphere-accuracy-foreground [a&]:hover:bg-sphere-accuracy/90",
        evasion: "border-transparent bg-sphere-evasion text-sphere-evasion-foreground [a&]:hover:bg-sphere-evasion/90",
        luck: "border-transparent bg-sphere-luck text-sphere-luck-foreground [a&]:hover:bg-sphere-luck/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
