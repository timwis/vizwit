<template>
  <div id="app">
    <SiteHeader/>
    <div id="page">
      <div id="content">
        <SiteHero/>
        <SiteBreadcrumbs/>
        <article class="row columns">
          <PageHeader title="Crime incidents"/>
          <p>Nulla auctor vehicula lacus nec sodales. Vivamus a nibh nibh. Nunc blandit elementum ipsum feugiat dapibus. In viverra urna ut urna tristique, condimentum mollis arcu mattis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Integer elementum non augue quis venenatis. Nulla facilisi.</p>

          <h2>By dispatch date</h2>
          <div class="row">
            <div class="medium-24 columns">
              <Widget
                :filters="filters"
                :height="300"
                chart-type="datetime"
                provider="carto"
                domain="phl.carto.com"
                dataset="incidents_part1_part2"
                group-by="date_trunc('month', dispatch_date_time)"
                trigger-field="dispatch_date"
                order="label"
                @filter="onFilter"/>
            </div>
          </div>

          <h2>By general crime category</h2>
          <div class="row">
            <div class="medium-16 columns">
              <Widget
                :filters="filters"
                :height="300"
                chart-type="bar"
                provider="carto"
                domain="phl.carto.com"
                dataset="incidents_part1_part2"
                group-by="text_general_code"
                @filter="onFilter"/>
            </div>
            <div class="medium-8 columns">
              <aside class="related">
                <h4 class="h4">General crime categories</h4>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean nec ipsum bibendum, ultrices leo at, tincidunt justo. Aenean eleifend orci ante, sed varius justo volutpat quis. Fusce tincidunt nisi et ligula porta, id gravida magna tincidunt.</p>
                <p>Cras sit amet quam eleifend urna sollicitudin maximus. Aenean mattis ut nisl sit amet lacinia.</p>
                <p>Source: Incident dispatch system</p>
              </aside>
            </div>
          </div>

          <h2>By police district</h2>
          <div class="row">
            <div class="medium-16 columns">
              <Widget
                :filters="filters"
                :height="300"
                chart-type="bar"
                provider="carto"
                domain="phl.carto.com"
                dataset="incidents_part1_part2"
                group-by="dc_dist"
                @filter="onFilter"/>
            </div>
            <div class="medium-8 columns">
              <aside class="related">
                <h4 class="h4">Police districts</h4>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean nec ipsum bibendum, ultrices leo at, tincidunt justo. Aenean eleifend orci ante, sed varius justo volutpat quis. Fusce tincidunt nisi et ligula porta, id gravida magna tincidunt.</p>
                <p>Cras sit amet quam eleifend urna sollicitudin maximus. Aenean mattis ut nisl sit amet lacinia.</p>
                <p>Source: Incident dispatch system</p>
              </aside>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import Widget from './components/Widget'
import PageHeader from './components/phila/PageHeader'
import SiteBreadcrumbs from './components/phila/SiteBreadcrumbs'
import SiteHeader from './components/phila/SiteHeader'
import SiteHero from './components/phila/SiteHero'

export default {
  components: {
    Widget,
    PageHeader,
    SiteBreadcrumbs,
    SiteHeader,
    SiteHero
  },
  data () {
    return {
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

<style lang="sass">
@fa-font-path: "~font-awesome/fonts"
// @import "~phila-standards/src/sass/phila-standards"
@import "~phila-standards/dist/css/phila-standards.min.css"

.related
  border-left: 5px solid #cfcfcf
  padding-left: 2rem
</style>
