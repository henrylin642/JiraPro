export const STAGE_LABELS: Record<string, string> = {
    'LEAD': '潛在客戶',
    'QUALIFICATION': '資格確認',
    'PROPOSAL': '提案階段',
    'NEGOTIATION': '議價談判',
    'CLOSED_WON': '成交',
    'CLOSED_LOST': '結案',
};

export const STAGE_ORDER = ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

export const STAGE_CHECKLISTS: Record<string, { id: string; label: string; weight: number }[]> = {
    'LEAD': [
        { id: 'LEAD_BG_CHECK', label: 'Company Background Check (公司背景調查)', weight: 5 },
        { id: 'LEAD_CONTACT', label: 'Identify Key Contact (確認關鍵聯絡人)', weight: 5 },
    ],
    'QUALIFICATION': [
        { id: 'BANT_BUDGET', label: 'Budget Confirmed (是否有預算)', weight: 10 },
        { id: 'BANT_AUTHORITY', label: 'Authority Verified (對口是否為決策者)', weight: 10 },
        { id: 'BANT_NEED', label: 'Need Identified (痛點與需求確認)', weight: 10 },
        { id: 'BANT_TIMING', label: 'Timing Agreed (導入時程確認)', weight: 10 },
    ],
    'PROPOSAL': [
        { id: 'PROP_SENT', label: 'Proposal/Quote Sent (報價單已寄出)', weight: 10 },
        { id: 'PROP_DEMO', label: 'Demo / POC Completed (展示/驗證完成)', weight: 10 },
        { id: 'PROP_SCOPE', label: 'Scope Approved (施作範圍確認)', weight: 10 },
    ],
    'NEGOTIATION': [
        { id: 'NEG_LEGAL', label: 'Legal/Compliance Review (法務審閱)', weight: 10 },
        { id: 'NEG_PRICE', label: 'Price/Payment Terms Agreed (價格與付款條件確認)', weight: 10 },
        { id: 'NEG_CONTRACT', label: 'Contract Drafted (合約草稿擬定)', weight: 10 },
    ],
    'CLOSED_WON': [
        { id: 'WON_SIGNED', label: 'Contract Signed (合約已簽署)', weight: 10 },
        { id: 'WON_PAYMENT', label: 'First Payment Received (收到首款)', weight: 10 },
    ],
    'CLOSED_LOST': [
        { id: 'LOST_POST_MORTEM', label: 'Post-Mortem Completed (結案分析完成)', weight: 0 },
    ],
};

export const BASE_PROBABILITIES: Record<string, number> = {
    'LEAD': 10,
    'QUALIFICATION': 10,
    'PROPOSAL': 40,
    'NEGOTIATION': 70,
    'CLOSED_WON': 100,
    'CLOSED_LOST': 0,
};
