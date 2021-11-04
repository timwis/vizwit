<template>
  <main class="container">
    <h1 class="title is-1">VizWit Crossfilter Demo</h1>
    <div class="columns">
      <div class="column is-half">
        <Widget
          :filters="filters"
          title="Crimes by date (carto)"
          chart-type="datetime"
          provider="carto"
          domain="timwis.carto.com"
          dataset="crimes_2015_to_oct_2016"
          channel="crimes"
          group-by="date_trunc('month', dispatch_date)"
          trigger-field="dispatch_date"
          order="key"
          @filter="filter"/>
      </div>
      <div class="column is-half">
        <Widget
          :filters="filters"
          title="Police district (carto)"
          chart-type="bar"
          provider="carto"
          domain="timwis.carto.com"
          dataset="crimes_2015_to_oct_2016"
          channel="crimes"
          group-by="dc_dist"
          @filter="filter"/>
      </div>
    </div>
    <div class="columns">
      <div class="column is-half">
        <Widget
          :filters="filters"
          title="General crime category (memory)"
          chart-type="bar"
          provider="memory"
          dataset="crimes_2015_10k.csv"
          channel="crimes"
          group-by="text_general_code"
          @filter="filter"/>
      </div>
      <div class="column is-half">
        <Widget
          :filters="filters"
          title="Location (memory)"
          chart-type="bar"
          provider="memory"
          dataset="crimes_2015_10k.csv"
          channel="crimes"
          group-by="location_block"
          @filter="filter"/>
      </div>
    </div>
    <div class="columns">
      <div class="column">
        <Widget
          :filters="filters"
          title="General crime category (carto)"
          chart-type="bar"
          provider="carto"
          domain="timwis.carto.com"
          dataset="crimes_2015_to_oct_2016"
          channel="crimes"
          group-by="text_general_code"
          @filter="filter"/>
      </div>
    </div>
  </main>
</template>

<script>
import Vue from 'vue'
import { mapState, mapActions } from 'vuex'

import Widget from './components/Widget'

export default {
  components: {
    Widget
  },
  /* data () {
    return {
      filters: {}
    }
  }, */
  computed: {
    ...mapState(['filters'])
  },
  methods: {
    ...mapActions(['filter'])
    /* onFilter ({ channel, field, expression }) {
      this.filters[channel] = this.filters[channel] || {}

      if (expression) {
        console.log('setting filter', { channel, field, expression })
        Vue.set(this.filters, field, { field, expression })
      } else {
        Vue.delete(this.filters[channel], field)
      }
    } */
  }
}
</script>
