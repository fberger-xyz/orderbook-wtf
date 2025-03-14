// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractErrorMessage = (error: any): string => {
    const needToParseError = !(error instanceof Error)
    if (needToParseError) error = new Error(error)
    return error.message
}
