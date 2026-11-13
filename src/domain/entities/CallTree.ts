export type CallTreeDocument = {
  version: string
  entry: string
  nodes: Record<string, unknown>
}

export class CallTree {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly document: CallTreeDocument,
    public readonly createdAt: Date,
  ) {}
}
