import { NextRequest, NextResponse } from 'next/server';

interface WhoisAnalysis {
  domain: string;
  available: boolean;
  registrar?: string;
  createdDate?: string;
  updatedDate?: string;
  expiryDate?: string;
  domainAge?: number;
  daysUntilExpiry?: number;
  nameServers?: string[];
  status?: string[];
  dnssec?: string;
  issues: string[];
  recommendations: string[];
}

// Free WHOIS API endpoint - 500 requests per month free tier
const WHOIS_API_KEY = process.env.WHOIS_API_KEY || '';
const WHOIS_API_URL = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Extract domain from URL if needed
    let cleanDomain = domain;
    if (domain.includes('://')) {
      cleanDomain = new URL(domain).hostname;
    }
    cleanDomain = cleanDomain.replace('www.', '');

    // If no API key, use basic analysis
    if (!WHOIS_API_KEY) {
      return await basicDomainAnalysis(cleanDomain);
    }

    // Use WHOIS API for detailed information
    const params = new URLSearchParams({
      apiKey: WHOIS_API_KEY,
      domainName: cleanDomain,
      outputFormat: 'JSON'
    });

    const response = await fetch(`${WHOIS_API_URL}?${params}`);
    
    if (!response.ok) {
      return await basicDomainAnalysis(cleanDomain);
    }

    const data = await response.json();
    const analysis = parseWhoisData(data, cleanDomain);

    return NextResponse.json(analysis);
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to analyze domain' },
      { status: 500 }
    );
  }
}

async function basicDomainAnalysis(domain: string): Promise<NextResponse> {
  // Basic analysis without API
  const issues: string[] = [];
  const recommendations: string[] = [
    'Consider setting up WHOIS API key for detailed domain information',
    'Monitor domain expiry date',
    'Ensure domain auto-renewal is enabled'
  ];

  // Check if domain is reachable
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    const analysis: WhoisAnalysis = {
      domain,
      available: false,
      issues,
      recommendations,
      status: ['Domain is reachable']
    };

    return NextResponse.json(analysis);
  } catch (error) {
    issues.push('Domain may be unreachable or not properly configured');
    
    const analysis: WhoisAnalysis = {
      domain,
      available: false,
      issues,
      recommendations
    };

    return NextResponse.json(analysis);
  }
}

function parseWhoisData(data: any, domain: string): WhoisAnalysis {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!data.WhoisRecord) {
    return {
      domain,
      available: true,
      issues: ['Domain appears to be available'],
      recommendations: ['Register this domain if it matches your brand']
    };
  }

  const record = data.WhoisRecord;
  
  // Parse dates
  const createdDate = record.createdDate || record.createdDateNormalized;
  const updatedDate = record.updatedDate || record.updatedDateNormalized;
  const expiryDate = record.expiresDate || record.expiresDateNormalized;

  // Calculate domain age
  let domainAge: number | undefined;
  if (createdDate) {
    const created = new Date(createdDate);
    const now = new Date();
    domainAge = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  // Calculate days until expiry
  let daysUntilExpiry: number | undefined;
  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 30) {
      issues.push(`Domain expires in ${daysUntilExpiry} days!`);
      recommendations.push('Renew domain immediately');
    } else if (daysUntilExpiry < 90) {
      recommendations.push(`Domain expires in ${daysUntilExpiry} days - plan renewal`);
    }
  }

  // Domain age analysis for SEO
  if (domainAge !== undefined) {
    if (domainAge < 1) {
      recommendations.push('New domain - building authority will take time');
      recommendations.push('Focus on quality content and backlinks');
    } else if (domainAge < 2) {
      recommendations.push('Young domain - continue building domain authority');
    }
  }

  // Parse name servers
  const nameServers = record.nameServers?.hostNames || [];
  
  // Check for common issues
  if (nameServers.length < 2) {
    issues.push('Less than 2 nameservers configured');
    recommendations.push('Add redundant nameservers for reliability');
  }

  // Parse status
  const status = record.status ? 
    (Array.isArray(record.status) ? record.status : [record.status]) : [];
  
  // Check for concerning statuses
  if (status.some((s: string) => s.toLowerCase().includes('hold'))) {
    issues.push('Domain has a hold status');
  }
  if (status.some((s: string) => s.toLowerCase().includes('pending'))) {
    issues.push('Domain has a pending status that needs attention');
  }

  // DNSSEC check
  const dnssec = record.dnssec || 'unsigned';
  if (dnssec === 'unsigned') {
    recommendations.push('Consider enabling DNSSEC for enhanced security');
  }

  return {
    domain,
    available: false,
    registrar: record.registrarName,
    createdDate,
    updatedDate,
    expiryDate,
    domainAge,
    daysUntilExpiry,
    nameServers,
    status,
    dnssec,
    issues,
    recommendations: recommendations.length > 0 ? recommendations : ['Domain configuration appears healthy']
  };
}