const path = require('path');
const { deflateSync } = require('zlib');
const OBJFile = require('obj-file-parser');

const loaderUtils = require('loader-utils');
const validateOptions = require('schema-utils');

const schema = require('./options.json');

module.exports.default = function loader(content) {
  const options = loaderUtils.getOptions(this) || {};

  validateOptions(schema, options, 'OBJ Loader');

  const context = options.context || this.rootContext;

  const url = loaderUtils.interpolateName(this, options.name, {
    context,
    content,
    regExp: options.regExp,
  });

  let outputPath = url;

  if (options.outputPath) {
    if (typeof options.outputPath === 'function') {
      outputPath = options.outputPath(url, this.resourcePath, context);
    } else {
      outputPath = path.posix.join(options.outputPath, url);
    }
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;

  if (options.publicPath) {
    if (typeof options.publicPath === 'function') {
      publicPath = options.publicPath(url, this.resourcePath, context);
    } else {
      publicPath = `${
        options.publicPath.endsWith('/')
          ? options.publicPath
          : `${options.publicPath}/`
      }${url}`;
    }

    publicPath = JSON.stringify(publicPath);
  }

  if (typeof options.emitFile === 'undefined' || options.emitFile) {
    const {
      models,
    } = (new OBJFile(content.toString('utf8'))).parse();
    const model = models.filter(({ faces, vertices }) => (
      !!faces.length && !!vertices.length
    ))[0];
    if (!model) {
      throw new Error('Could find any model');
    }
    const {
      faces,
      vertices,
      vertexNormals,
    } = model;
    const normals = [];
    const indices = faces.reduce((indices, { vertices }) => {
      let face;
      if (vertices.length === 4) {
        face = [
          vertices[0].vertexIndex - 1,
          vertices[1].vertexIndex - 1,
          vertices[2].vertexIndex - 1,
          vertices[2].vertexIndex - 1,
          vertices[3].vertexIndex - 1,
          vertices[0].vertexIndex - 1,
        ];
      } else {
        face = vertices.map(({ vertexIndex }) => (vertexIndex - 1));
      }
      if (vertexNormals) {
        vertices.forEach(({ vertexIndex, vertexNormalIndex }) => {
          normals[vertexIndex - 1] = vertexNormals[vertexNormalIndex - 1];
        });
      }
      indices.push(...face);
      return indices;
    }, []);
    const position = vertices.reduce((position, { x, y, z }) => {
      position.push(x, y, z);
      return position;
    }, []);
    const normal = normals.reduce((normal, { x, y, z }) => {
      normal.push(x, y, z);
      return normal;
    }, []);

    this.emitFile(outputPath, deflateSync(Buffer.concat([
      Buffer.from((new Uint16Array([indices.length])).buffer),
      Buffer.from((new Uint16Array(indices)).buffer),
      Buffer.from((new Uint16Array([position.length])).buffer),
      Buffer.from((new Float32Array(position)).buffer),
      Buffer.from((new Float32Array(normal)).buffer),
    ])));
  }

  return `export default ${publicPath};`;
};

module.exports.raw = true;
