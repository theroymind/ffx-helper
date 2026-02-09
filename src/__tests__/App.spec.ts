import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import App from "../App.vue";

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  });
}

describe("App", () => {
  it("mounts properly", () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), createTestRouter()],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
