<template>
  <main>
    <component
      v-for="widget in widgets"
      :key="widget.title"
      :is="widget.provider"
      :config="widget"
      :filters="filters"
      @filter="onFilter">
      <component
        :is="widget.chartType"
        :initial-data="initialData"
        :filtered-data="filteredData"
        slot-scope="{ initialData, filteredData, onSelect }"
        @select="onSelect"/>
    </component>
  </main>
</template>

<script>
import Vue from 'vue'
import Carto from './components/providers/Carto'
import Bar from './components/charts/Bar'
import widgets from '../fixtures/config-crime-incidents.json'

export default {
  components: {
    Carto,
    Bar: Bar
  },
  data () {
    return {
      widgets,
      filters: {}
    }
  },
  methods: {
    onFilter (filter) {
      if (filter.expression) {
        console.log('setting filter', filter)
        Vue.set(this.filters, filter.field, filter)
      } else {
        Vue.delete(this.filters, filter.field)
      }
    }
  }
}
</script>
