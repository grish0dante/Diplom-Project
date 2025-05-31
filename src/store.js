import { createStore } from 'vuex';
import axios from 'axios';

export default createStore({
  state: {
    token: localStorage.getItem('auth_token') || null,
    user: null
  },
  
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user
  },
  
  mutations: {
    setToken(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    },
    setUser(state, user) {
      state.user = user;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('auth_token');
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
        const { token, user } = response.data;
        commit('setToken', token);
        commit('setUser', user);
        return { success: true };
      } catch (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: error.response?.data?.message || 'Помилка входу'
        };
      }
    },
    
    async register({ commit }, userData) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/register', userData);
        const { token, user } = response.data;
        commit('setToken', token);
        commit('setUser', user);
        return { success: true };
      } catch (error) {
        console.error('Registration error:', error);
        return { 
          success: false, 
          error: error.response?.data?.message || 'Помилка реєстрації'
        };
      }
    },
    
    async verifyAuth({ commit, state }) {
      if (!state.token) return false;
      
      try {
        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        commit('setUser', response.data.user);
        return true;
      } catch (error) {
        console.error('Auth verification failed:', error);
        commit('logout');
        return false;
      }
    },

    logout({ commit }) {
      commit('logout');
    }
  }
}); 