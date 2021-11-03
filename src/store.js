import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import neatCsv from 'neat-csv'
import crossfilter from 'crossfilter2'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    filters: {},
    datasets: {}
  },
  mutations: {
    setDataset (state, { data, channel }) {
      Vue.set(state.datasets, channel, {
        data,
        cube: null,
        dimensions: {}
      })
    },
    createCube (state, { data, channel }) {
      const dataset = state.datasets[channel]
      const cube = crossfilter(data)
      Vue.set(dataset, 'cube', cube)
    },
    createDimension (state, { channel, field }) {
      const dataset = state.datasets[channel]
      if (dataset.dimensions[field]) return

      const dimension = dataset.cube.dimension(field)
      Vue.set(dataset.dimensions, field, dimension)
    },
    setFilter (state, filter) {
      const { field, channel } = filter
      if (!state.filters[channel]) Vue.set(state.filters, channel, {})
      Vue.set(state.filters[channel], field, filter)
    },
    deleteFilter (state, filter) {
      const { field, channel } = filter
      Vue.delete(state.filters[channel], field)
    },
    // TODO: Move crossfilter modifiers to actions
    filterDimension (state, { channel, field, expression }) {
      const dataset = state.datasets[channel]
      const dimension = dataset.dimensions[field]
      // TODO: work with other expression types
      dimension.filter(expression.value)
    },
    unfilterDimension (state, { channel, field }) {
      const dataset = state.datasets[channel]
      const dimension = dataset.dimensions[field]
      dimension.filterAll()
    }
  },
  actions: {
    async getDataset ({ commit }, { datasetName, channel }) {
      const url = constructUrl(datasetName)
      const response = await axios.get(url)
      const data = await neatCsv(response.data)

      commit('setDataset', { data, channel })
      commit('createCube', { data, channel })
    },
    filter ({ commit, state }, filter) {
      const { field, expression, channel } = filter
      const dataset = state.datasets[channel]
      console.log('filtering', filter)

      if (filter.expression) {
        commit('setFilter', filter)

        if (dataset) {
          if (!dataset.dimensions[field]) {
            commit('createDimension', { channel, field })
          }
          commit('filterDimension', filter)
        }
      } else {
        commit('deleteFilter', filter)

        if (dataset) {
          commit('unfilterDimension', filter)
        }
      }
    }
  }
})

function constructUrl (dataset) {
  return `data/${dataset}`
}
