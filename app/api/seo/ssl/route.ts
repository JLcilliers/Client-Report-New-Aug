import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { URL } from 'url';
import { TLSSocket } from 'tls';

interface SSLAnalysis {
  valid: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  protocol?: string;
  cipher?: string;
  issues: string[];
  recommendations: string[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const parsedUrl = new URL(url);

    const analysis = await checkSSL(parsedUrl.hostname);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('SSL check error:', error);
    return NextResponse.json(
      { error: 'Failed to check SSL certificate' },
      { status: 500 }
    );
  }
}

function checkSSL(hostname: string): Promise<SSLAnalysis> {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      const tlsSocket = res.socket as TLSSocket;
      const cert: any = tlsSocket.getPeerCertificate ? tlsSocket.getPeerCertificate() : {};
      
      if (!cert || Object.keys(cert).length === 0) {
        resolve({
          valid: false,
          issues: ['No SSL certificate found'],
          recommendations: [
            'Install an SSL certificate',
            'Use Let\'s Encrypt for free SSL certificates',
            'Ensure HTTPS is properly configured'
          ],
          grade: 'F'
        });
        return;
      }

      const now = new Date();
      const validFrom = cert.valid_from ? new Date(cert.valid_from) : new Date();
      const validTo = cert.valid_to ? new Date(cert.valid_to) : new Date();
      const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      let grade: SSLAnalysis['grade'] = 'A';

      // Check if certificate is valid
      if (now < validFrom || now > validTo) {
        issues.push('Certificate is expired or not yet valid');
        grade = 'F';
      } else if (daysRemaining < 30) {
        issues.push(`Certificate expires in ${daysRemaining} days`);
        recommendations.push('Renew SSL certificate soon');
        grade = 'C';
      } else if (daysRemaining < 60) {
        recommendations.push(`Certificate expires in ${daysRemaining} days - plan renewal`);
        grade = 'B';
      }

      // Check protocol version
      const protocol = (res.socket as any).getProtocol?.();
      if (protocol) {
        if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
          issues.push(`Outdated protocol: ${protocol}`);
          recommendations.push('Enable TLS 1.2 or higher');
          grade = grade === 'A' ? 'B' : grade;
        }
      }

      // Check cipher
      const cipher = (res.socket as any).getCipher?.();
      if (cipher && cipher.name) {
        if (cipher.name.includes('RC4') || cipher.name.includes('MD5')) {
          issues.push('Weak cipher suite detected');
          recommendations.push('Use modern cipher suites');
          grade = grade === 'A' || grade === 'B' ? 'C' : grade;
        }
      }

      // Additional security checks
      const headers = res.headers;
      if (!headers['strict-transport-security']) {
        recommendations.push('Enable HSTS (HTTP Strict Transport Security)');
        grade = grade === 'A' ? 'B' : grade;
      }

      resolve({
        valid: true,
        issuer: cert.issuer?.O || cert.issuer?.CN,
        subject: cert.subject?.CN,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        daysRemaining,
        protocol,
        cipher: cipher?.name,
        issues,
        recommendations: recommendations.length > 0 ? recommendations : ['SSL certificate is properly configured'],
        grade
      });
    });

    req.on('error', (error) => {
      resolve({
        valid: false,
        issues: [`SSL check failed: ${error.message}`],
        recommendations: [
          'Ensure HTTPS is enabled',
          'Check firewall settings',
          'Verify SSL certificate installation'
        ],
        grade: 'F'
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        valid: false,
        issues: ['SSL check timed out'],
        recommendations: ['Check server response time', 'Verify HTTPS configuration'],
        grade: 'F'
      });
    });

    req.end();
  });
}