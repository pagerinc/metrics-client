FROM node:10.16-alpine@sha256:07897ec27318d8e43cfc6b1762e7a28ed01479ba4927aca0cdff53c1de9ea6fd

WORKDIR /home/node/app

COPY package.json package-lock.json /home/node/app/
RUN chown -R node /home/node && \
	apk add --no-cache --virtual .build-deps \
		gcc \
		g++ \
		make \
		python && \
	npm install --quiet --production && \
	npm cache clean --force && \
	apk del .build-deps

COPY . /home/node/app

EXPOSE 3000
USER node

CMD ["npm", "start", "-s"]
