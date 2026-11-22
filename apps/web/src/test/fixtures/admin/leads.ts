import type { components } from '@/generated/api';
import { adminActor, adminIds, adminUuid } from './ids';

type Schemas = components['schemas'];

export type AdminLead = Schemas['LeadAdminDto_Output'];
export type AdminLeadsResponse = Schemas['LeadListResponseDto_Output'];
export type AdminLeadRow = AdminLeadsResponse['items'][number];
export type AdminLeadNote = Schemas['LeadNoteDto_Output'];
export type AdminLeadStatus = AdminLead['status'];

export function makeAdminLeadCalculation(
  overrides: Partial<AdminLead['calculation']> = {},
): AdminLead['calculation'] {
  return {
    publicId: 'k3m9x2q7',
    number: 3,
    createdAt: '2026-11-18T10:00:00.000Z',
    expiresAt: '2026-12-18T10:00:00.000Z',
    expired: false,
    incomplete: false,
    pricingVersion: 'pv-2026-11-10',
    style: { id: adminIds.styles.modern, name: 'Modern' },
    configuration: {
      scope: 'FULL',
      finishLevel: 'PRE_FINISH',
      totalAreaSqm: 54,
      balconyAreaSqm: 0,
      balconyTiles: false,
      rooms: [
        {
          clientId: 'room-1',
          name: 'Living room',
          roomTypeCode: 'LIVING_ROOM',
          lengthM: 5,
          widthM: 4,
          heightM: 2.7,
          heatedFloor: false,
          selections: [
            {
              categoryId: adminIds.categories.flooring,
              productId: adminIds.products.laminate,
            },
          ],
        },
      ],
      options: [],
      currency: 'USD',
    },
    rooms: [
      {
        clientId: 'room-1',
        roomTypeCode: 'LIVING_ROOM',
        lengthM: 5,
        widthM: 4,
        heightM: 2.7,
        heatedFloor: false,
        name: 'Living room',
        roomTypeName: 'Living room',
      },
    ],
    lines: [],
    accessories: {},
    totals: { usdCents: 1250000, uahKopecks: 51875000, sections: {} },
    warnings: [],
    exchangeRate: { rate: '41.5000', date: '2026-11-18', source: 'NBU' },
    priceStatus: null,
    versions: [
      {
        number: 3,
        createdAt: '2026-11-18T10:00:00.000Z',
        totalUsdCents: 1250000,
        expired: false,
      },
    ],
    ...overrides,
  };
}

export function makeAdminLead(overrides: Partial<AdminLead> = {}): AdminLead {
  return {
    id: adminIds.leads.new,
    number: 1042,
    createdAt: '2026-11-18T10:05:00.000Z',
    status: 'NEW',
    name: 'Test Client',
    phone: '+380 00 000 00 01',
    email: 'client1@example.com',
    expiredAtSubmission: false,
    totalUsdCents: 1250000,
    masked: false,
    comment: 'Please call after 18:00.',
    consentText:
      'I agree to the processing of my contact details for this request.',
    consentAt: '2026-11-18T10:05:00.000Z',
    locale: 'en',
    revision: adminUuid(9100),
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'NEW',
        changedAt: '2026-11-18T10:05:00.000Z',
        changedBy: null,
      },
    ],
    notes: [],
    calculation: makeAdminLeadCalculation(),
    ...overrides,
  };
}

export function makeAdminLeadRow(
  lead: AdminLead = makeAdminLead(),
): AdminLeadRow {
  return {
    id: lead.id,
    number: lead.number,
    createdAt: lead.createdAt,
    status: lead.status,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    expiredAtSubmission: lead.expiredAtSubmission,
    totalUsdCents: lead.totalUsdCents,
    masked: lead.masked,
  };
}

export function makeMaskedAdminLead(
  overrides: Partial<AdminLead> = {},
): AdminLead {
  return makeAdminLead({
    name: 'T*** C***',
    phone: '+380 ** *** ** 01',
    email: 'c***@example.com',
    comment: null,
    masked: true,
    ...overrides,
  });
}

export function makeAdminLeadDetails(): AdminLead[] {
  const note: AdminLeadNote = {
    id: adminUuid(9200),
    text: 'Called, agreed a visit on Friday.',
    createdAt: '2026-11-19T09:00:00.000Z',
    author: adminActor,
  };
  return [
    makeAdminLead(),
    makeAdminLead({
      id: adminIds.leads.inProgress,
      number: 1041,
      status: 'IN_PROGRESS',
      name: 'Test Client Two',
      phone: '+380 00 000 00 02',
      email: null,
      notes: [note],
      statusHistory: [
        {
          fromStatus: null,
          toStatus: 'NEW',
          changedAt: '2026-11-17T08:00:00.000Z',
          changedBy: null,
        },
        {
          fromStatus: 'NEW',
          toStatus: 'IN_PROGRESS',
          changedAt: '2026-11-19T09:00:00.000Z',
          changedBy: adminActor,
        },
      ],
    }),
    makeAdminLead({
      id: adminIds.leads.done,
      number: 1040,
      status: 'DONE',
      name: 'Test Client Three',
      phone: '+380 00 000 00 03',
      expiredAtSubmission: true,
    }),
    makeAdminLead({
      id: adminIds.leads.rejected,
      number: 1039,
      status: 'REJECTED',
      name: 'Test Client Four',
      phone: '+380 00 000 00 04',
    }),
    makeMaskedAdminLead({
      id: adminIds.leads.spam,
      number: 1038,
      status: 'SPAM',
    }),
  ];
}

export function makeAdminLeads(): AdminLeadsResponse {
  const items = makeAdminLeadDetails().map(makeAdminLeadRow);
  return { items, page: 1, pageSize: 20, total: items.length };
}
