# Security Policy

## Content Security Policy (CSP)

This documentation site implements a strict Content-Security-Policy (CSP) to protect against cross-site scripting (XSS) and injection attacks.

### CSP Directives

The following CSP policy is enforced:

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
img-src 'self' data: https:;
connect-src 'self' https:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### Directive Explanation

- **default-src 'self'**: All content must come from the same origin by default
- **script-src 'self' 'wasm-unsafe-eval'**: Scripts allowed from same origin; `wasm-unsafe-eval` is needed for Docusaurus functionality
- **style-src 'self' 'unsafe-inline'**: Styles allowed from same origin with inline styles (required by Docusaurus theming)
- **font-src 'self' data:** Fonts from same origin and data URLs
- **img-src 'self' data: https**: Images from same origin, data URLs, and HTTPS resources
- **connect-src 'self' https:**: AJAX/WebSocket connections to same origin or HTTPS
- **frame-ancestors 'none'**: Prevents embedding in iframes (clickjacking protection)
- **base-uri 'self'**: Base URLs must be same origin
- **form-action 'self'**: Forms can only submit to same origin

### Implementation

CSP is implemented through:

1. **Meta Tag** (Primary - GitHub Pages): Added to `docusaurus.config.ts` in the headTags configuration
2. **HTTP Header** (Fallback): Static `_headers` file for edge deployments
3. **Security Headers**: Additional headers configured for defense-in-depth:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Testing CSP

CSP violations are logged to the browser console in report-only mode during development. To test:

1. Open Developer Tools (F12)
2. Check the Console tab for CSP violation reports
3. Verify no legitimate resources are being blocked

### CSP Violations

If you encounter CSP violations:

1. Check the console for specific error messages
2. Identify the resource causing the violation
3. Update the appropriate directive if the resource is legitimate
4. Test locally with `bun run build && bun run serve`

### Monitoring

- Monitor browser console for CSP violations during development
- Use SecurityHeaders.com to verify CSP implementation
- Keep CSP policy up-to-date as dependencies change

### Future Enhancements

- [ ] Implement CSP reporting endpoint for production monitoring
- [ ] Use CSP nonce for inline scripts (future Docusaurus versions)
- [ ] Tighten `style-src` to remove `unsafe-inline` when possible
- [ ] Add `report-uri` or `report-to` for violation reporting

## Cross-Site Request Forgery (CSRF) Protection

CSRF tokens protect against unauthorized form submissions and API requests from malicious sites.

### Implementation

#### Token Generation and Storage

CSRF tokens are generated and stored securely:

```typescript
// Generate a cryptographically secure random token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
```

**Storage Location**: SessionStorage (preferred over localStorage)
- Session-scoped: Tokens expire when the browser tab closes
- Not persisted to disk
- Not sent with cross-domain requests
- Cleared after successful submission

#### Newsletter Endpoint Protection

The newsletter subscription form includes CSRF protection:

1. **Token Generation**: On page load or form render
2. **Token Transmission**: Sent via `X-CSRF-Token` header
3. **Server Validation**: Backend must verify token matches stored value
4. **Token Rotation**: Optional - backend can rotate tokens for enhanced security

```typescript
// Client-side implementation
const csrfToken = getOrCreateCSRFToken();
const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  credentials: 'same-origin',
  body: JSON.stringify({ email: email.trim() }),
});
```

### Defense in Depth

Multiple CSRF protections work together:

1. **CSRF Token** (`X-CSRF-Token` header)
   - Random 32-byte token per session
   - Validated by server

2. **SameSite Cookie** (browser-enforced)
   - `credentials: 'same-origin'` in fetch
   - Prevents cookie transmission on cross-site requests
   - Automatic browser enforcement (Chrome, Firefox, Safari)

3. **Content-Type Validation**
   - `Content-Type: application/json`
   - Requires explicit CORS for non-preflighted requests
   - Prevents simple form-based CSRF attacks

4. **Origin Validation**
   - Server must verify `Origin` header matches expected domain
   - Prevents requests from other domains

### How CSRF Attacks Are Blocked

**Attack Scenario**: Malicious site tries to subscribe attacker's email

```html
<!-- attacker.com -->
<form action="https://soroban-cookbook.dev/api/newsletter" method="POST">
  <input name="email" value="attacker@evil.com" />
</form>
```

**Why it's blocked**:
1. ❌ No CSRF token in request
2. ❌ SameSite cookie not sent (cross-origin)
3. ❌ Application/JSON content-type triggers CORS preflight
4. ❌ Origin header doesn't match

### Testing CSRF Protection

#### Manual Testing

1. Generate a token in the browser console:
```javascript
// Works - same origin
fetch('https://soroban-cookbook.dev/api/newsletter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': sessionStorage.getItem('soroban-csrf-token'),
  },
  credentials: 'same-origin',
  body: JSON.stringify({ email: 'test@example.com' }),
});
```

2. Attempt without token:
```javascript
// Fails - no CSRF token
fetch('https://soroban-cookbook.dev/api/newsletter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' }),
});
```

### Backend Implementation Requirements

When implementing the newsletter endpoint, include:

```typescript
// Pseudocode for backend validation
function validateCSRFToken(request: Request): boolean {
  const clientToken = request.headers.get('X-CSRF-Token');
  const serverToken = request.session.get('csrf-token');
  
  // 1. Token exists
  if (!clientToken || !serverToken) {
    return false;
  }
  
  // 2. Tokens match
  if (clientToken !== serverToken) {
    return false;
  }
  
  // 3. Origin matches
  const origin = request.headers.get('Origin');
  if (origin && origin !== request.headers.get('Host')) {
    return false;
  }
  
  // 4. Content-Type is JSON
  const contentType = request.headers.get('Content-Type');
  if (!contentType?.includes('application/json')) {
    return false;
  }
  
  // Optional: Rotate token for next request
  request.session.set('csrf-token', generateNewToken());
  
  return true;
}
```

### API Security Guidelines

For all backend endpoints:

1. **POST/PUT/DELETE** requests:
   - Require CSRF token via `X-CSRF-Token` header
   - Validate SameSite cookie behavior
   - Verify `Origin` header

2. **GET** requests:
   - Don't modify state
   - Don't require CSRF tokens (read-only)

3. **Error Handling**:
   - Return `403 Forbidden` for CSRF failures
   - Log CSRF violations for monitoring
   - Don't expose internal token details

4. **Token Rotation**:
   - Optional but recommended
   - Generate new token after successful submission
   - Rotate token on privilege escalation

### Common Vulnerabilities to Avoid

❌ **Don't**:
- Store CSRF token in localStorage (persists across sessions)
- Include token in URL query parameters (logged in referrer headers)
- Use predictable or static tokens
- Skip validation on "internal" endpoints
- Allow GET requests to modify state

✅ **Do**:
- Store tokens in sessionStorage
- Transmit tokens via request headers
- Use cryptographically secure random generation
- Validate all state-changing requests
- Treat all endpoints as public

## Reporting Security Issues

If you discover a security vulnerability, please email security@soroban-cookbook.dev instead of using the issue tracker.

## Oracle Security & Trust Model

When using oracle contracts for price feeds and external data, understand the trust and security implications.

### Oracle Trust Assumptions

An oracle consumer contract makes several trust assumptions about its oracle:

1. **Data Accuracy**: Oracle reports correct, unmanipulated prices
2. **Timeliness**: Oracle updates prices at regular intervals
3. **Availability**: Oracle contract remains accessible
4. **Integrity**: Oracle code has not been compromised
5. **Incentive Alignment**: Oracle is economically incentivized to be honest

### Sources of Oracle Risk

#### 1. Data Manipulation

**Risk**: Oracle provides false prices

**Scenario**: Attacker gains control of oracle and sets inflated prices for their token

**Mitigation**:
- Use multiple independent oracle sources
- Implement price bounds checking
- Monitor for unusual price movements
- Use median price from multiple oracles

```rust
// ✓ Good: Use multiple sources
let prices = vec![
    oracle_1.get_price(&env, &asset)?,
    oracle_2.get_price(&env, &asset)?,
    oracle_3.get_price(&env, &asset)?,
];
prices.sort();
let median = prices[prices.len() / 2];
```

#### 2. Stale Data

**Risk**: Oracle goes offline or updates stop; contract uses outdated prices

**Scenario**: Oracle service failure; contract continues using 1-week-old prices

**Mitigation**:
- Set appropriate max_age for data freshness
- Implement fallback mechanisms (cached prices, circuit breakers)
- Monitor oracle update frequency
- Use time-weighted average prices (TWAP)

```rust
// ✓ Good: Check data freshness
let age = current_time - timestamp;
if age > max_age {
    return Err(OracleError::StaleData);
}
```

#### 3. Availability Attacks

**Risk**: Oracle contract becomes unavailable, DOS attacks

**Scenario**: Malicious actor floods oracle with requests; service becomes slow/unavailable

**Mitigation**:
- Set gas limits on oracle calls
- Implement timeouts and fallback logic
- Use circuit breakers to pause operations
- Cache prices for fallback scenarios

```rust
// ✓ Good: Fallback to cached price
pub fn get_price_safe(env: Env, asset: Symbol) -> Result<i128, OracleError> {
    match self.get_price(&env, &asset) {
        Ok(price) => Ok(price),
        Err(_) => self.get_cached_price(&env, &asset),
    }
}
```

#### 4. Single Point of Failure

**Risk**: Relying on single oracle source

**Scenario**: Oracle compromise; all dependent contracts fail

**Mitigation**:
- Always use multiple oracle sources
- Implement protocol-level diversity
- Use decentralized oracle networks (Chainlink, Pyth)
- Geographic/infrastructure diversity

```rust
// ✗ Bad: Single oracle dependency
let price = oracle_1.get_price(&asset)?;

// ✓ Good: Multiple oracle sources
let price1 = oracle_1.get_price(&asset)?;
let price2 = oracle_2.get_price(&asset)?;
let price3 = oracle_3.get_price(&asset)?;
calculate_median(vec![price1, price2, price3])
```

#### 5. Price Manipulation

**Risk**: Attackers manipulate underlying exchange prices

**Scenario**: Flash loan attack; attacker dumps tokens to crash price on DEX

**Mitigation**:
- Use oracle prices, not DEX prices
- Implement circuit breakers for unusual price movements
- Use time-weighted average prices (TWAP)
- Require multiple blocks/time intervals

```rust
// ✓ Good: Check for unusual price deviations
pub fn validate_price(new_price: i128, last_price: i128) -> Result<(), OracleError> {
    // Allow max 10% change
    let max_deviation = last_price / 10;
    let deviation = (new_price - last_price).abs();
    
    if deviation > max_deviation {
        return Err(OracleError::PriceDeviation);
    }
    Ok(())
}
```

### Oracle Security Checklist

Before using an oracle, verify:

- [ ] **Independence**: Oracle source is independent from other oracles
- [ ] **Decentralization**: Not controlled by single entity
- [ ] **Reputation**: Well-known, audited oracle service
- [ ] **Incentives**: Clear economic incentive structure
- [ ] **Transparency**: Price sources and methodology documented
- [ ] **Monitoring**: Real-time monitoring and alerts
- [ ] **Governance**: Update process is transparent and governed
- [ ] **Insurance**: Bonding or insurance for data accuracy
- [ ] **Diversity**: Use multiple independent sources
- [ ] **Fallback**: Have fallback mechanism if oracle fails

### Recommended Oracle Implementations

#### Chainlink

- **Type**: Decentralized oracle network
- **Coverage**: Wide range of assets and chains
- **Security**: Economic incentives, reputation system
- **Use**: Production DEX/lending protocols

#### Pyth Network

- **Type**: High-frequency oracle network
- **Coverage**: Crypto assets, stocks, commodities
- **Security**: First-price consensus mechanism
- **Use**: Price-sensitive applications

#### Stellar Native

- **Type**: On-chain decentralized exchange (SDEX)
- **Coverage**: Stellar-native tokens
- **Security**: Market-driven, trust-minimized
- **Use**: Stellar ecosystem DEX/swaps

### Oracle Usage Guidelines

#### For Developers

```rust
// ✓ Best Practice
pub struct OracleConfig {
    pub oracle_addresses: Vec<Address>,
    pub max_price_age: u64,
    pub max_price_deviation: i128,
    pub min_oracle_responses: u32,
}

pub fn init_oracle(env: Env, config: OracleConfig) {
    // Store multiple oracle sources
    env.storage()
        .instance()
        .set(&symbol_short!("oracles"), &config.oracle_addresses);
}
```

#### For Auditors

Review oracle usage for:
- [ ] Multiple oracle sources used
- [ ] Price freshness validation
- [ ] Price deviation checks
- [ ] Fallback mechanisms
- [ ] Circuit breakers
- [ ] Error handling

#### For Users

Understand oracle risks:
- Your funds depend on oracle accuracy
- Oracle outages can freeze operations
- Price manipulation can cause losses
- Diversify across multiple protocols

## Additional Security Resources

- [MDN Web Docs - Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP - Cross-Site Request Forgery (CSRF)](https://owasp.org/www-community/attacks/csrf)
- [OWASP - Content Security Policy](https://owasp.org/www-community/attacks/xss/)
- [SecurityHeaders.com](https://securityheaders.com/)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)
- [Chainlink Security & Accuracy](https://docs.chain.link/any-api/security)
- [Oracle Risks & Mitigation](https://ethereum.org/en/developers/docs/smart-contracts/security/)
