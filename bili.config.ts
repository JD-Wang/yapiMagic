/*
 * @Descripttion:
 * @LastEditors: wjd
 * @LastEditTime: 2022-08-14 14:39:15
 */
import { Config } from 'bili'

const config: Config = {
  input: 'src/index.ts',
  output: {
    dir: 'client',
    format: ['cjs', 'esm'],
  },
  plugins: {
    typescript2: false,
  },
}

export default config
