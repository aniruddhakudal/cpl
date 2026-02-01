import mammoth from 'mammoth';

export const loadRulesFromDocx = async () => {
  try {
    const response = await fetch('/data/CPL_RULE_BOOK.docx');
    const arrayBuffer = await response.arrayBuffer();
    
    // Convert to HTML with image support
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.inline(function(image) {
          return image.read("base64").then(function(imageBuffer) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            };
          });
        })
      }
    );
    const htmlContent = result.value;
    
    // Parse rules from HTML - rules start with "Rule:"
    const rules = parseRulesFromHtml(htmlContent);
    return rules;
  } catch (error) {
    console.error('Error loading rules:', error);
    throw error;
  }
};

const parseRulesFromHtml = (html) => {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get all child nodes to preserve order
  const allNodes = Array.from(tempDiv.childNodes);
  
  const rules = [];
  let currentRule = null;
  let currentRuleContent = [];
  
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    
    // Skip text nodes that are just whitespace
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
      continue;
    }
    
    // Get text content for rule detection
    let text = '';
    let element = null;
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      element = node;
      text = element.textContent || '';
    } else if (node.nodeType === Node.TEXT_NODE) {
      text = node.textContent || '';
    }
    
    // Check if this contains "Rule:" (case insensitive)
    const ruleMatch = text.match(/Rule:\s*(.+)/i);
    
    if (ruleMatch) {
      // Save previous rule if exists
      if (currentRule !== null && currentRuleContent.length > 0) {
        rules.push({
          number: currentRule.number,
          title: currentRule.title,
          content: currentRuleContent.join('')
        });
      }
      
      // Start new rule
      const ruleHeader = ruleMatch[1].trim();
      
      // Extract rule number from header (e.g., "1", "2.1", etc.)
      const numberMatch = ruleHeader.match(/^(\d+(?:\.\d+)*)/);
      const ruleNumber = numberMatch ? numberMatch[1] : `${rules.length + 1}`;
      
      // Get the title (everything after the number, or the whole header if no number)
      let ruleTitle = ruleHeader;
      if (numberMatch) {
        ruleTitle = ruleHeader.substring(numberMatch[0].length).trim();
        // If title is empty after removing number, use the full header
        if (!ruleTitle) {
          ruleTitle = ruleHeader;
        }
      }
      
      currentRule = {
        number: ruleNumber,
        title: ruleTitle
      };
      currentRuleContent = [];
      
      // Don't add the rule header element to content - it's already displayed in the button
      // Skip this element and only add subsequent content
    } else if (currentRule !== null) {
      // This is content for the current rule
      // Preserve the HTML structure including images
      if (node.nodeType === Node.ELEMENT_NODE) {
        const nodeElement = node;
        const nodeText = nodeElement.textContent || '';
        const hasContent = nodeText.trim() || 
                          nodeElement.querySelector('img') || 
                          nodeElement.tagName === 'IMG' ||
                          nodeElement.innerHTML.trim();
        
        if (hasContent) {
          currentRuleContent.push(nodeElement.outerHTML);
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        // Wrap text nodes in paragraph tags
        currentRuleContent.push(`<p>${node.textContent.trim()}</p>`);
      }
    }
  }
  
  // Don't forget the last rule
  if (currentRule !== null && currentRuleContent.length > 0) {
    rules.push({
      number: currentRule.number,
      title: currentRule.title,
      content: currentRuleContent.join('')
    });
  }
  
  // If no rules found with the above method, try alternative parsing by text splitting
  if (rules.length === 0) {
    const textContent = tempDiv.textContent || '';
    const ruleSections = textContent.split(/Rule:/i).filter(section => section.trim().length > 0);
    
    ruleSections.forEach((section, index) => {
      const trimmedSection = section.trim();
      const lines = trimmedSection.split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (lines.length > 0) {
        const firstLine = lines[0];
        const ruleNumberMatch = firstLine.match(/^(\d+(?:\.\d+)*)/);
        const ruleNumber = ruleNumberMatch ? ruleNumberMatch[1] : `${index + 1}`;
        let ruleTitle = firstLine;
        if (ruleNumberMatch) {
          ruleTitle = firstLine.substring(ruleNumberMatch[0].length).trim() || firstLine;
        }
        
        const ruleBody = lines.slice(1).join('\n').trim();
        
        rules.push({
          number: ruleNumber,
          title: ruleTitle,
          content: ruleBody ? `<p>${ruleBody.replace(/\n/g, '</p><p>')}</p>` : ''
        });
      }
    });
  }
  
  return rules;
};
