import { defineStore } from "pinia";
import { ref } from "vue";

export const useDemoDataStore = defineStore("demo-data", () => {
  
  const calls_history = ref([
    {
      date_time: "2025-11-20 17:00",
      number: "+998916517911",
      duration: 11,
      type: {
        number: 1,
        name: "Incoming",
      },
      status: {
        number: 2,
        name: "Not answered",
      },
      contact: null
    },
    {
      date_time: "2025-11-20 16:56",
      number: "+998916517912",
      duration: 11,
      type: {
        number: 1,
        name: "Incoming",
      },
      status: {
        number: 1,
        name: "Answered",
      },
      contact: null
    },
    {
      date_time: "2025-11-20 17:00",
      number: "+998916517913",
      duration: 11,
      type: {
        number: 2,
        name: "Outgoing",
      },
      status: {
        number: 2,
        name: "Not answered",
      },
      contact: null
    },
    {
      date_time: "2025-11-20 16:56",
      number: "+998916517914",
      duration: 11,
      type: {
        number: 2,
        name: "Outgoing",
      },
      status: {
        number: 1,
        name: "Answered",
      },
      contact: null
    },
    {
      date_time: "2025-11-20 17:00",
      number: "1002",
      duration: 11,
      type: {
        number: 3,
        name: "Internal",
      },
      status: {
        number: 2,
        name: "Not answered",
      },
      contact: null
    },
    {
      date_time: "2025-11-20 16:56",
      number: "1001",
      duration: 11,
      type: {
        number: 3,
        name: "Internal",
      },
      status: {
        number: 1,
        name: "Answered",
      },
      contact: null
    },
  ]);

  return {
    calls_history
  }
});
