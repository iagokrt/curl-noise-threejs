# threejs fbo particles

"To do anything useful with WebGL generally requires quite a bit of code and that is where three.js comes in. It handles stuff like scenes, lights, shadows, materials, textures, 3d math, all things that you'd have to write yourself if you were to use WebGL directly."

- [https://threejsfundamentals.org/](https://threejsfundamentals.org/)

---

After getting some fun ~~and~~ ~~trouble~~ with threejs is time to move to shader coding!!

Shader is a term often used to reference glsl shader code, which is actually **OpenGL Shading Language**

- [https://www.khronos.org/opengl/wiki/Core*Language*(GLSL)](<https://www.khronos.org/opengl/wiki/Core_Language_(GLSL)>)
- [https://thebookofshaders.com/](https://thebookofshaders.com/)

## Example using curl noise functions inside shaders

using **three.js** we can easily create shader code to web browsers!

![Project - Preview](./public/demo.gif)

# Running things locally:

execute **yarn** or **npm**.

_Depending on what development package manager you're using._

_You can use either yarn or npm._

- Installing dependencies

```powershell
yarn

npm install
```

- Running the development server

```powershell
yarn dev

npm run dev
```

🚧 WORK IN PROGRESS 🚧

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 1O% Setup - Initial Configuration and Template

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 2O% Setup - Adding Threejs to project

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 3O% Setup - Adding Shader Code to Template

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 4O% Project - initialize GPUComputationRenderer on three.js

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 5O% Shaders - Bringing Curl Noise Function to project.

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 6O% Load OBJ with three.js loaders

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 7O% Link data from loaded obj with the shaders

✔️ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 8O% refactor

❌ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 85% use model within gpgpu

❌ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 9O% work on presentation of the project

❌ [̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 100% publish
