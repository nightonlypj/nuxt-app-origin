# Nuxt.jsベースアプリケーション

運営元が情報提供して1つのサービスを作る（BtoC向け）  
(Nuxt @ v2.15.4)

## コマンドメモ

```
yarn install
yarn dev
yarn test
yarn lint
yarn lint --fix
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
Homebrew 3.2.13
※バージョンは異なっても良い
```

### yarnインストール

```
$ brew install yarn

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
1.22.10
※バージョンは異なっても良い
```

### 起動まで

```
$ cd nuxt-app-origin
$ yarn install
Done

$ yarn dev
```

- http://localhost:3000
