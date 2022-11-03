export type javaRelease = {
  arguments: {
    game: Array<any>
    jvm: [
      {
        rules: Array<{
          action: string
          os: {
            name: string
          }
        }>
        value: Array<string>
      },
      {
        rules: Array<{
          action: string
          os: {
            name: string
          }
        }>
        value: string
      },
      {
        rules: Array<{
          action: string
          os: {
            name: string
            version: string
          }
        }>
        value: Array<string>
      },
      {
        rules: Array<{
          action: string
          os: {
            arch: string
          }
        }>
        value: string
      },
      string,
      string,
      string,
      string,
      string
    ]
  }
  assetIndex: {
    id: string
    sha1: string
    size: number
    totalSize: number
    url: string
  }
  assets: string
  complianceLevel: number
  downloads: {
    client: {
      sha1: string
      size: number
      url: string
    }
    client_mappings: {
      sha1: string
      size: number
      url: string
    }
    server: {
      sha1: string
      size: number
      url: string
    }
    server_mappings: {
      sha1: string
      size: number
      url: string
    }
  }
  id: string
  javaVersion: {
    component: string
    majorVersion: number
  }
  libraries: Array<{
    downloads: {
      artifact: {
        path: string
        sha1: string
        size: number
        url: string
      }
      classifiers?: {
        javadoc?: {
          path: string
          sha1: string
          size: number
          url: string
        }
        "natives-osx"?: {
          path: string
          sha1: string
          size: number
          url: string
        }
        sources?: {
          path: string
          sha1: string
          size: number
          url: string
        }
        "natives-linux"?: {
          path: string
          sha1: string
          size: number
          url: string
        }
        "natives-windows"?: {
          path: string
          sha1: string
          size: number
          url: string
        }
        "natives-macos"?: {
          path: string
          sha1: string
          size: number
          url: string
        }
      }
    }
    name: string
    rules?: Array<{
      action: string
      os?: {
        name: string
      }
    }>
    natives?: {
      osx?: string
      linux?: string
      windows?: string
    }
    extract?: {
      exclude: Array<string>
    }
  }>
  logging: {
    client: {
      argument: string
      file: {
        id: string
        sha1: string
        size: number
        url: string
      }
      type: string
    }
  }
  mainClass: string
  minimumLauncherVersion: number
  releaseTime: string
  time: string
  type: string
}