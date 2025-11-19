import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hp: "bg-sphere-hp text-sphere-hp-foreground shadow-xs hover:bg-sphere-hp/90",
        mp: "bg-sphere-mp text-sphere-mp-foreground shadow-xs hover:bg-sphere-mp/90",
        strength: "bg-sphere-strength text-sphere-strength-foreground shadow-xs hover:bg-sphere-strength/90",
        defense: "bg-sphere-defense text-sphere-defense-foreground shadow-xs hover:bg-sphere-defense/90",
        magic: "bg-sphere-magic text-sphere-magic-foreground shadow-xs hover:bg-sphere-magic/90",
        magicDef: "bg-sphere-magicDef text-sphere-magicDef-foreground shadow-xs hover:bg-sphere-magicDef/90",
        agility: "bg-sphere-agility text-sphere-agility-foreground shadow-xs hover:bg-sphere-agility/90",
        accuracy: "bg-sphere-accuracy text-sphere-accuracy-foreground shadow-xs hover:bg-sphere-accuracy/90",
        evasion: "bg-sphere-evasion text-sphere-evasion-foreground shadow-xs hover:bg-sphere-evasion/90",
        luck: "bg-sphere-luck text-sphere-luck-foreground shadow-xs hover:bg-sphere-luck/90",
        ability: "bg-sphere-ability text-sphere-ability-foreground shadow-xs hover:bg-sphere-ability/90",
        locked: "bg-sphere-locked text-sphere-locked-foreground shadow-xs hover:bg-sphere-locked/90",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
