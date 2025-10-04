# https://hub.docker.com/_/node
FROM node:22.19.0-alpine
RUN apk add --no-cache \
    tzdata \
    musl-locales \
    musl-locales-lang \
    coreutils \
    busybox-extras \
    bash \
    git \
    vim

WORKDIR /workdir
ENV TZ='Asia/Tokyo'

ENV LANG='ja_JP.UTF-8'
ENV LC_ALL='ja_JP.UTF-8'

RUN echo -e "\
export LS_OPTIONS='--color=auto'\n\
eval \"\$(dircolors -b)\"\n\
alias ls='ls \$LS_OPTIONS'\n\
alias ll='ls -lF'\n\
alias l='ls -lAF'\n\
alias rm='rm -i'\n\
alias cp='cp -i'\n\
alias mv='mv -i'\
" >> ~/.bashrc
