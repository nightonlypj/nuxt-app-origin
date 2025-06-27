# Nuxt.js(Vue.js/Vuetify)ベースアプリケーション

運営元が情報提供して1つのサービスを作る（BtoC向け）  
(Nuxt 3.17.5)

## コマンドメモ

```
yarn install
yarn dev -o

yarn test （ファイル名）
yarn test:coverage （ファイル名）
yarn test:watch （ファイル名）
open coverage/index.html

yarn lint
yarn lint:fix
yarn eslint ファイル名
yarn eslint:fix ファイル名
```
```
yarn generate
```

## 環境構築手順（Macの場合）

### Homebrewインストール

```
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
Warning: /opt/homebrew/bin is not in your PATH.
（$ brew update）

※zshの場合(Catalina以降)
% vi ~/.zshrc
※bashの場合
$ vi ~/.bash_profile
---- ここから ----
### START ###
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
### END ###
---- ここまで ----

※zshの場合(Catalina以降)
% source ~/.zshrc
※bashの場合
$ source ~/.bash_profile

$ brew doctor
Your system is ready to brew.

$ brew -v
Homebrew 4.5.0
※バージョンは異なっても良い
```

### Node.jsインストール

```
$ brew install nvm
（$ brew upgrade nvm）
$ mkdir ~/.nvm

※zshの場合(Catalina以降)
% vi ~/.zshrc
※bashの場合
$ vi ~/.bash_profile
---- ここから ----
### START ###
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
### END ###
---- ここまで ----

※zshの場合(Catalina以降)
% source ~/.zshrc
※bashの場合
$ source ~/.bash_profile

$ nvm --version
0.40.3
※バージョンは異なっても良い
```
```
$ nvm ls-remote | grep 'Latest LTS'
       v18.20.8   (Latest LTS: Hydrogen)
       v20.19.2   (Latest LTS: Iron)
       v22.16.0   (Latest LTS: Jod)

$ nvm install v22.16.0
（$ nvm use v22.16.0）
（$ nvm alias default v22.16.0）

$ node -v
v22.16.0

$ nvm ls
->     v22.16.0
         system
default -> v22.16.0
```

### yarnインストール

```
$ brew install yarn
（$ brew upgrade yarn）

※zshの場合(Catalina以降)
% vi ~/.zshrc
※bashの場合
$ vi ~/.bash_profile
---- ここから ----
export PATH="/opt/homebrew/opt/icu4c/bin:/opt/homebrew/opt/icu4c/sbin:$PATH"
---- ここまで ----

※zshの場合(Catalina以降)
% source ~/.zshrc
※bashの場合
$ source ~/.bash_profile

$ yarn -v
1.22.22
※バージョンは異なっても良い
```

### 起動まで

```
$ cd nuxt-app-origin
$ yarn install
Done

$ yarn dev -o
```
