// Type definitions for i18n
export type SupportedLanguages = 'en' | 'zh'

export interface I18nResources {
  common: {
    loading: string
    saving: string
    cancel: string
    confirm: string
    delete: string
    edit: string
    add: string
    save: string
    close: string
    yes: string
    no: string
    optional: string
    required: string
    success: string
    error: string
    warning: string
    info: string
  }
  navigation: {
    connections: string
    connectionsDesc: string
    settings: string
    settingsDesc: string
    stats: string
    statsDesc: string
    about: string
    aboutDesc: string
    appTitle: string
    appSubtitle: string
    networkStatus: string
  }
  ssh: {
    configName: string
    configNamePlaceholder: string
    host: string
    hostPlaceholder: string
    port: string
    username: string
    usernamePlaceholder: string
    authType: string
    authMethod: string
    passwordAuth: string
    passwordAuthDesc: string
    keyAuth: string
    keyAuthDesc: string
    password: string
    passwordPlaceholder: string
    privateKey: string
    privateKeyPlaceholder: string
    passphrase: string
    passphrasePlaceholder: string
    basicInfo: string
    authConfig: string
    securityTitle: string
    securityDesc: string
    securityFeature1: string
    securityFeature2: string
    securityFeature3: string
    clickToShowPrivateKey: string
    privateKeySecurityNote: string
    addConfig: string
    editConfig: string
    saveConfig: string
    updating: string
    submitting: string
    showPrivateKeyInput: string
    hidePrivateKeyInput: string
    formErrors: {
      nameRequired: string
      nameMaxLength: string
      hostRequired: string
      hostInvalid: string
      portMin: string
      portMax: string
      portInteger: string
      usernameRequired: string
      usernameMaxLength: string
      usernameInvalid: string
      authTypeRequired: string
      authInfoRequired: string
      passwordRequired: string
      privateKeyRequired: string
    }
  }
  wallet: {
    connect: string
    disconnect: string
    connecting: string
    connected: string
    register: string
    registering: string
    registered: string
    registration: {
      title: string
      description: string
      walletRequired: string
      registerButton: string
      registering: string
    }
  }
  errors: {
    networkError: string
    connectionFailed: string
    authenticationFailed: string
    configSaveFailed: string
    configLoadFailed: string
    configDeleteFailed: string
    unknown: string
  }
  settings: {
    language: string
    theme: string
    general: string
    security: string
    advanced: string
  }
  views: {
    connections: {
      connectWallet: string
      connectWalletDesc: string
      decentralizedStorage: string
      endToEndEncryption: string
      sshSecureConnection: string
      completeAuthentication: string
      authenticationDesc: string
      clickVerifyButton: string
    }
    terminal: {
      connectWalletToStart: string
      connectWalletDesc: string
      secureConnection: string
      endToEndEncryption: string
      needRegistration: string
      registrationDesc: string
      clickConnectButton: string
      loadingConfig: string
      sessionNotFound: string
      sessionNotFoundDesc: string
      backToConfigList: string
      connectingTo: string
      waitingConnection: string
      connectionFailed: string
      reconnect: string
      connectNow: string
    }
    about: {
      version: string
      productIntro: string
      productDesc: string
      coreFeatures: string
      features: {
        unifiedAuth: {
          title: string
          description: string
        }
        decentralizedStorage: {
          title: string
          description: string
        }
        secureConnection: {
          title: string
          description: string
        }
        crossPlatform: {
          title: string
          description: string
        }
      }
      techStack: string
      frontend: string
      blockchain: string
      security: string
      contact: string
      github: string
      website: string
      email: string
      copyright: string
      license: string
    }
    stats: {
      title: string
      description: string
    }
  }
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: I18nResources['common']
      navigation: I18nResources['navigation'] 
      ssh: I18nResources['ssh']
      wallet: I18nResources['wallet']
      errors: I18nResources['errors']
      settings: I18nResources['settings']
      views: I18nResources['views']
    }
  }
}