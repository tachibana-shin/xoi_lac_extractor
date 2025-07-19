import { getIdApiMatch } from "./get-id-api-match.ts"

test("getIdApiMatch returns expected value", () => {
  const input = "dIeDgFY"
  const expectedOutput = "7kMNIxbM04ueHThK_kykUw"
  const actualOutput = getIdApiMatch(input)

  assert(actualOutput, expectedOutput)
})
