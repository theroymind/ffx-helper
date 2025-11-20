import { useLocalStorage } from '@vueuse/core'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_COMPLETED_KEY = 'ffx-sphere-grid-tour-completed'

export function useSphereGridTour() {
  const tourCompleted = useLocalStorage(TOUR_COMPLETED_KEY, false)

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    popoverClass: 'driver-popover-custom',
    onDestroyed: () => {
      tourCompleted.value = true
    },
    steps: [
      {
        popover: {
          title: 'Welcome to the FFX Sphere Grid Planner',
          description: 'Plan your character progression to achieve max stats or endgame builds. This tour will show you how to use the planner.',
        }
      },
      {
        element: '[data-tour="stats-bar"]',
        popover: {
          title: 'Stats Overview',
          description: 'View your current stat totals here. Each stat shows the current value and cap (if applicable). The badge next to each stat indicates how many stat spheres you need to farm.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="details-button"]',
        popover: {
          title: 'Detailed Stats',
          description: 'Click here to view a comprehensive overview of all your stats and sphere counts.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '[data-tour="help-button"]',
        popover: {
          title: 'Help & Import/Export',
          description: 'Access additional information, import/export your grid configuration, and view keyboard shortcuts.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '[data-tour="grid-toolbar"]',
        popover: {
          title: 'Grid Type & Display',
          description: 'Switch between Standard and Expert grids, and toggle between icon or number display on nodes.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="sphere-toolbar"]',
        popover: {
          title: 'Sphere Type Selector',
          description: 'Select a sphere type (HP, MP, Strength, etc.) to paint nodes on the grid. Click nodes to assign the selected type.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="controls-toolbar"]',
        popover: {
          title: 'Selection & Controls',
          description: 'Toggle selection mode to assign spheres to multiple nodes at once. Use Reset to restore original values or Clear to empty all nodes.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        popover: {
          title: 'Ready to Plan!',
          description: 'Start clicking nodes on the grid to customize sphere types and build your perfect character. Your progress is automatically saved.',
        }
      }
    ]
  })

  function startTour() {
    driverObj.drive()
  }

  function shouldAutoStart() {
    return !tourCompleted.value
  }

  return { startTour, shouldAutoStart }
}
