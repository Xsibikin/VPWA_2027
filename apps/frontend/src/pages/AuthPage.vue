<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const $q = useQuasar();
const tab = ref('login');
const email = ref('');
const password = ref('');
const name = ref('');
const handle = ref('');
const showPassword = ref(false);
const loading = ref(false);
const required = (value: string) => !!value.trim() || 'This field is required';
const emailRule = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email address';
function toggleTheme() {
  $q.dark.toggle();
  localStorage.setItem('gather-theme', $q.dark.isActive ? 'dark' : 'light');
}
async function submit(demo = false) {
  loading.value = true;
  try {
    if (demo) await auth.login('demo@slack.clone', 'demo1234');
    else if (tab.value === 'login') await auth.login(email.value, password.value);
    else
      await auth.register({
        name: name.value,
        handle: handle.value,
        email: email.value,
        password: password.value,
      });
    $q.notify({
      message: `Welcome ${auth.user?.name.split(' ')[0]}! Make yourself at home.`,
      icon: 'waving_hand',
      color: 'primary',
    });
    await router.push('/');
  } catch (error) {
    $q.notify({ type: 'negative', message: (error as Error).message });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <q-layout view="hHh lpR fFf"
    ><q-page-container
      ><q-page class="auth-page">
        <header class="auth-brand">
          <span>gather<span class="brand-dot">.</span></span>
        </header>
        <q-btn
          class="auth-theme"
          flat
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          aria-label="Toggle theme"
          @click="toggleTheme"
        />
        <div class="auth-content">
          <q-card class="auth-card">
            <q-tabs
              v-model="tab"
              no-caps
              active-color="primary"
              indicator-color="primary"
              align="justify"
              class="auth-tabs"
              ><q-tab name="login" label="Sign in" /><q-tab
                name="register"
                label="Create an account"
            /></q-tabs>
            <q-card-section>
              <h2>{{ tab === 'login' ? 'Welcome back 👋' : 'Make yourself at home 🌿' }}</h2>
              <p class="muted">
                {{
                  tab === 'login'
                    ? 'Your team is just a conversation away.'
                    : 'A fresh start for you and your team.'
                }}
              </p>
              <q-form @submit="submit(false)" class="auth-form">
                <template v-if="tab === 'register'"
                  ><q-input
                    v-model="name"
                    outlined
                    label="Full name"
                    autocomplete="name"
                    :rules="[required]" /><q-input
                    v-model="handle"
                    outlined
                    label="Display name"
                    autocomplete="nickname"
                    :rules="[required]"
                /></template>
                <q-input
                  v-model="email"
                  outlined
                  label="Email address"
                  type="email"
                  autocomplete="email"
                  :rules="[required, emailRule]"
                />
                <q-input
                  v-model="password"
                  outlined
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  :autocomplete="tab === 'login' ? 'current-password' : 'new-password'"
                  :rules="[required, (value) => value.length >= 8 || 'Use at least 8 characters']"
                  ><template #append
                    ><q-btn
                      flat
                      round
                      dense
                      :icon="showPassword ? 'visibility_off' : 'visibility'"
                      aria-label="Show or hide password"
                      @click="showPassword = !showPassword" /></template
                ></q-input>
                <q-btn
                  type="submit"
                  unelevated
                  color="primary"
                  no-caps
                  :label="tab === 'login' ? 'Sign in to Gather' : 'Create your account'"
                  icon-right="arrow_forward"
                  class="full-width auth-submit"
                  :loading="loading"
                />
              </q-form>
              <div class="or-divider">
                <q-separator /><span>or take a look around</span><q-separator />
              </div>
              <q-btn
                outline
                no-caps
                class="full-width demo-button"
                icon="auto_awesome"
                label="Use demo workspace"
                :disable="loading"
                @click="submit(true)"
              />
              <div class="demo-credentials">demo@slack.clone <span>·</span> demo1234</div>
            </q-card-section>
          </q-card>
        </div>
      </q-page></q-page-container
    ></q-layout
  >
</template>
