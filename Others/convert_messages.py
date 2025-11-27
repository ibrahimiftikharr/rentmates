# Python script to convert student messages page
import re

# Read the current file
with open(r'd:\Downloads\FYP UI\frontend\src\domains\student\pages\MessagesPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Key changes:
# 1. Change main container
content = re.sub(
    r'return \(\s*<div className="h-\[calc\(100vh-80px\)\] flex flex-col">',
    'return (\n    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-[#F4F5FA]">',
    content
)

# 2. Remove the middle wrapping div
content = re.sub(
    r'{\* Main Content - Full Height \*}[^<]*<div className="flex gap-3 flex-1 overflow-hidden">\s*',
    '',
    content
)

# 3. Fix left column class
content = re.sub(
    r'<div className={\`w-full lg:w-\[35%\] flex-shrink-0 \$\{showMobileChat \? \'hidden lg:block\' : \'block\'\}\`}>',
    '<div className={`${\n        showMobileChat ? \'hidden md:flex\' : \'flex\'\n      } md:w-[35%] lg:w-[30%] flex-col bg-white border-r h-full`}>',
    content
)

# 4. Remove Card wrapper
content = re.sub(
    r'<Card className="shadow-lg h-full flex flex-col">\s*<CardContent className="p-3 flex flex-col h-full">',
    '',
    content
)

# 5. Fix header section
content = re.sub(
    r'<div className="mb-3">\s*<h3 className="font-semibold mb-3">Chats</h3>\s*<div className="relative">',
    '<div className="p-4 md:p-6 border-b">\n          <div className="flex items-center gap-2 mb-4">\n            <MessageSquare className="h-6 w-6 text-[#8C57FF]" />\n            <h2 className="text-[#4A4A68]">Chats</h2>\n          </div>\n          \n          {/* Search Bar */}\n          <div className="relative">',
    content
)

# Save
with open(r'd:\Downloads\FYP UI\frontend\src\domains\student\pages\MessagesPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Conversion complete!")
