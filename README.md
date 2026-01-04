# Nuxt.js(Vue.js/Vuetify)ベースアプリケーション

運営元が情報提供して1つのサービスを作る（BtoC向け）  
(Nuxt 4.2.2)

## 環境構築手順（Dockerの場合） ※構築は早いが、動作は遅い

### Dockerインストール

#### Docker Desktop

https://docs.docker.com/desktop/

#### OrbStack

https://orbstack.dev/download

### コンテナ作成＆起動

```bash
$ cp -a .env.example .env

# dockerをビルドして起動（Ctrl-Cで強制終了。-dは[make down]で終了）
$ make up（または up-all, up-d, up-all-d）
```

- http://localhost:5000

## 環境構築手順（Macの場合） ※構築は手間だが、動作は早い

### Homebrewインストール

```bash
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
（$ brew update）

# zshの場合(Catalina以降)
% vi ~/.zshrc
# bashの場合
$ vi ~/.bash_profile
```
```bash
### START ###
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
### END ###
```
```bash
# zshの場合(Catalina以降)
% source ~/.zshrc
# bashの場合
$ source ~/.bash_profile

$ brew doctor
Your system is ready to brew.

$ brew -v
Homebrew 5.0.4
# バージョンは異なっても良い
```

### Node.jsインストール

```bash
$ brew install nvm
（$ brew upgrade nvm）
$ mkdir ~/.nvm

# zshの場合(Catalina以降)
% vi ~/.zshrc
# bashの場合
$ vi ~/.bash_profile
```
```bash
### START ###
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
### END ###
```
```bash
# zshの場合(Catalina以降)
% source ~/.zshrc
# bashの場合
$ source ~/.bash_profile

$ nvm --version
0.40.3
# バージョンは異なっても良い
```

```bash
$ nvm ls-remote | grep 'Latest LTS'
       v20.19.6   (Latest LTS: Iron)
       v22.21.1   (Latest LTS: Jod)
       v24.11.1   (Latest LTS: Krypton)

$ nvm install v24.11.1
（$ nvm use v24.11.1）
（$ nvm alias default v24.11.1）

$ node -v
v24.11.1

$ nvm ls
->     v24.11.1
default -> v24.11.1
```

### yarnインストール

```bash
$ brew install yarn
（$ brew upgrade yarn）

# zshの場合(Catalina以降)
% vi ~/.zshrc
# bashの場合
$ vi ~/.bash_profile
```
```bash
### START ###
export PATH="/opt/homebrew/opt/icu4c/bin:/opt/homebrew/opt/icu4c/sbin:$PATH"
### END ###
```
```bash
# zshの場合(Catalina以降)
% source ~/.zshrc
# bashの場合
$ source ~/.bash_profile

$ yarn -v
1.22.22
# バージョンは異なっても良い
```

### 起動まで

```bash
$ cp -a .env.example .env

# Node.jsバージョン変更
$ nvm use

# Packageインストール
$ make install（または yarn）

# 開発サーバーを起動
$ make dev
```

## 使い方

### docker

```bash
# dockerコンテナ内に接続
$ make bash
# 新しいdockerコンテナを作成し、コンテナ内に接続
$ make bash-new
```

### 更新

```bash
# Packageインストール
$ make install
```

### 起動

```bash
# 開発サーバーを起動
$ make dev
```

### その他

```bash
# ESLint実行・自動修正
$ make l（または lint）

# Vitest実行（パラメータでファイル名指定可）
$ make test

# 静的ファイル生成
$ cp -a config/production.ts,prod config/production.ts 
$ make generate
```
