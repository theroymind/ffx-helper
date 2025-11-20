<template>
  <div class="flex flex-col gap-6 py-4">
    <!-- Value Selector View -->
    <div v-if="showValueSelector">
      <h3 class="m-0 mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Select Value</h3>
      <div class="grid grid-cols-2 gap-2">
        <!-- HP has 2 variants: +200 and +300 -->
        <template v-if="selectedStatType === 'hp'">
          <Button
            v-for="value in [200, 300]"
            :key="value"
            @click="selectStatValue(value)"
            variant="hp"
            class="flex items-center justify-center py-6 text-lg font-bold"
          >
            +{{ value }}
          </Button>
        </template>

        <!-- MP has 2 variants: +20 and +40 -->
        <template v-else-if="selectedStatType === 'mp'">
          <Button
            v-for="value in [20, 40]"
            :key="value"
            @click="selectStatValue(value)"
            variant="mp"
            class="flex items-center justify-center py-6 text-lg font-bold"
          >
            +{{ value }}
          </Button>
        </template>

        <!-- Other stats have 4 variants: +1, +2, +3, +4 -->
        <template v-else>
          <Button
            v-for="value in [1, 2, 3, 4]"
            :key="value"
            @click="selectStatValue(value)"
            :variant="selectedStatType as any"
            class="flex items-center justify-center py-6 text-lg font-bold"
          >
            +{{ value }}
          </Button>
        </template>
      </div>
    </div>

    <!-- Lock Level Selector View -->
    <div v-else-if="showLockLevelSelector">
      <h3 class="m-0 mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Select Lock Level</h3>
      <div class="grid grid-cols-2 gap-2">
        <Button
          v-for="level in [1, 2, 3, 4]"
          :key="level"
          @click="selectLockedNode(level)"
          variant="locked"
          class="flex items-center justify-center py-6 text-lg font-bold"
        >
          Lock Level {{ level }}
        </Button>
      </div>
    </div>

    <!-- Ability Input View -->
    <div v-else-if="showAbilityInput" class="flex flex-col gap-3">
      <Label> Ability Name: </Label>
      <Combobox v-model="abilityName" v-model:search-term="abilitySearchTerm">
        <ComboboxAnchor as-child>
          <ComboboxInput ref="abilityInputRef" placeholder="Search abilities..." class="w-full" />
        </ComboboxAnchor>
        <ComboboxList class="max-h-[300px] overflow-auto">
          <ComboboxEmpty>No ability found.</ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxItem v-for="ability in filteredAbilities" :key="ability" :value="ability">
              {{ ability }}
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </Combobox>
      <Button @click="confirmAbilityNode" :disabled="!abilityName"> Add Ability Node </Button>
    </div>

    <!-- Type Selection View (Default) -->
    <div v-else class="flex flex-col gap-6">
      <!-- Stat Spheres -->
      <div>
        <h3 class="m-0 mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Stat Spheres</h3>
        <div class="grid grid-cols-2 gap-2">
          <StatButton
            v-for="statType in statTypes"
            :key="statType"
            :stat-type="statType"
            @click="selectNodeType(statType)"
          />
        </div>
      </div>

      <!-- Special Types -->
      <div>
        <h3 class="m-0 mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Special Types</h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
          <Button @click="selectNodeType(SphereType.Empty)" variant="secondary"> Empty </Button>
          <Button @click="showAbilityInput = true" variant="ability"> Ability </Button>
          <Button @click="showLockedNodeSelector" variant="locked"> Locked Node </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { SphereType } from "@/domain/grid/SphereType";
import Button from "@/components/ui/button/Button.vue";
import Label from "@/components/ui/label/Label.vue";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
} from "@/components/ui/combobox";
import { StatButton } from "@/components/sphere-grid";
import abilitiesData from "@/assets/abilities.json";

interface NodeData {
  type: SphereType;
  value?: number;
  lockLevel?: number | null;
  abilityName?: string | null;
}

interface GridNode {
  id: number;
  x: number;
  y: number;
  connections: number[];
  type: SphereType;
  value?: number;
  lockLevel?: number | null;
  abilityId?: number | null;
  abilityName?: string | null;
}

const props = defineProps<{
  pendingNodePosition: { x: number; y: number };
  existingNode?: GridNode | null;
}>();

const emit = defineEmits<{
  confirm: [nodeData: NodeData];
  cancel: [];
  updateTitle: [title: string];
  updateDescription: [description: string];
}>();

const abilityInputRef = ref<HTMLInputElement | null>(null);
const showAbilityInput = ref(false);
const abilityName = ref("");
const abilitySearchTerm = ref("");
const selectedStatType = ref<SphereType | null>(null);
const showValueSelector = ref(false);
const showLockLevelSelector = ref(false);

// Abilities list and filtering
const abilities = abilitiesData.map((ability) => ability.name).sort();
const filteredAbilities = computed(() => {
  if (!abilitySearchTerm.value) return abilities;
  return abilities.filter((ability) => ability.toLowerCase().includes(abilitySearchTerm.value.toLowerCase()));
});

// List of stat sphere types
const statTypes: SphereType[] = [
  SphereType.Hp,
  SphereType.Mp,
  SphereType.Strength,
  SphereType.Defense,
  SphereType.Magic,
  SphereType.MagicDef,
  SphereType.Agility,
  SphereType.Accuracy,
  SphereType.Evasion,
  SphereType.Luck,
];

// Title and description management
const updateDialogContent = () => {
  if (showValueSelector.value && selectedStatType.value) {
    const typeInfo: Record<string, string> = {
      hp: "HP",
      mp: "MP",
      strength: "Strength",
      defense: "Defense",
      magic: "Magic",
      magicDef: "Magic Defense",
      agility: "Agility",
      accuracy: "Accuracy",
      evasion: "Evasion",
      luck: "Luck",
    };
    emit("updateTitle", `Select ${typeInfo[selectedStatType.value] || "Stat"} Value`);
    emit("updateDescription", "back");
  } else if (showLockLevelSelector.value) {
    emit("updateTitle", "Select Lock Level");
    emit("updateDescription", "back");
  } else if (showAbilityInput.value) {
    emit("updateTitle", "Add Ability Node");
    emit("updateDescription", "back");
  } else {
    emit("updateTitle", "Select Node Type");
    emit("updateDescription", "default");
  }
};

// Node type selection handlers
function selectNodeType(type: SphereType) {
  if (type === SphereType.Empty) {
    emit("confirm", { type: SphereType.Empty, value: 0 });
  } else {
    selectedStatType.value = type;
    showValueSelector.value = true;
  }
}

function selectStatValue(value: number) {
  if (!selectedStatType.value) return;
  emit("confirm", { type: selectedStatType.value, value });
}

function showLockedNodeSelector() {
  showLockLevelSelector.value = true;
}

function selectLockedNode(level: number) {
  emit("confirm", { type: SphereType.Locked, lockLevel: level, value: 0 });
}

function confirmAbilityNode() {
  emit("confirm", { type: SphereType.Locked, abilityName: abilityName.value || "Ability", value: 0 });
}

// Watch for state changes to update dialog title/description
watch([showValueSelector, showLockLevelSelector, showAbilityInput, selectedStatType], () => {
  updateDialogContent();
});

// Auto-focus ability input when shown
watch(showAbilityInput, async (isShown) => {
  if (isShown) {
    await nextTick();
    // Give the combobox time to fully render
    setTimeout(() => {
      const input = document.querySelector('[placeholder="Search abilities..."]') as HTMLInputElement;
      input?.focus();
    }, 100);
  }
});

onMounted(() => {
  if (props.existingNode) {
    const node = props.existingNode;
    if (node.abilityName) {
      showAbilityInput.value = true;
      abilityName.value = node.abilityName;
    } else if (node.type === "locked" && node.lockLevel) {
      showLockLevelSelector.value = true;
    } else if (node.type !== "empty" && node.type !== "locked") {
      selectedStatType.value = node.type;
      showValueSelector.value = true;
    }
  }
  updateDialogContent();
});
</script>
