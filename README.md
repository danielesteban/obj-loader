obj-loader
===

[![dependencies Status](https://david-dm.org/danielesteban/obj-loader/status.svg)](https://david-dm.org/danielesteban/obj-loader)
[![devDependencies Status](https://david-dm.org/danielesteban/obj-loader/dev-status.svg)](https://david-dm.org/danielesteban/obj-loader?type=dev)

### Webpack config

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.obj$/,
        loader: 'obj-loader',
      },
    ],
  },
};
```

### Client usage

```js
import pako from 'pako';
import Model from '@/models/model.obj';

function FetchModel(url) {
  return fetch(url)
    .then(res => res.arrayBuffer())
    .then((deflated) => {
      const { buffer } = pako.inflate(new Uint8Array(deflated));
      let offset = 0;
      const indexCount = new Uint16Array(buffer, offset, 1)[0];
      offset += Uint16Array.BYTES_PER_ELEMENT;
      const index = new Uint16Array(buffer, offset, indexCount);
      offset += Uint16Array.BYTES_PER_ELEMENT * indexCount;
      const vertexCount = new Uint16Array(buffer, offset, 1)[0];
      offset += Uint16Array.BYTES_PER_ELEMENT;
      const position = new Float32Array(buffer, offset, vertexCount);
      offset += Float32Array.BYTES_PER_ELEMENT * vertexCount;
      const normal = new Float32Array(buffer, offset, vertexCount);
      return {
        index,
        position,
        normal,
      };
    });
}

FetchModel(Monkey)
  .then(({ index, position, normal }) => {
    const geometry = new BufferGeometry();
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.addAttribute('position', new BufferAttribute(position, 3));
    geometry.addAttribute('normal', new BufferAttribute(normal, 3));
  });
```
