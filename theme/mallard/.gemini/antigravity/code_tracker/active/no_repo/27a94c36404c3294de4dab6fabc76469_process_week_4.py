ù=import os
import re

source_file = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 4 Content.txt"
output_dir = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 4"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the top-level sections
sections = [
    {
        "id": "4.0.1",
        "marker": "4.0.1 Welcome to Week 4 [20mins]:",
        "filename": "4.0.1_Welcome_to_Week_4.html",
        "is_book": False
    },
    {
        "id": "4.1.1",
        "marker": "4.1.1 Defining Race, Racial Equality, and the Spectrum of Racism [40mins], which consists of five chapters;",
        "base_filename": "4.1.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Defining_Race_and_Racial_Equality",
            "The_Spectrum_of_Racism",
            "Systemic_and_Structural_Racism",
            "Engineering_and_Social_Justice_Lenses",
            "Interconnected_Disadvantages_and_Systemic_Feedback"
        ]
    },
    {
        "id": "4.1.2",
        "marker": "Then, 4.1.2 Positionality and Perception [60mins]:",
        "filename": "4.1.2_Positionality_and_Perception.html",
        "is_book": False
    },
    {
        "id": "4.2.1",
        "marker": "4.2.1 Historical Legacies: Colonialism, Science, and the Construction of Race [50mins] which consists of five chapters;",
        "base_filename": "4.2.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Science_as_an_Instrument_of_Empire",
            "Infrastructure_Science_Supporting_Colonialism",
            "Scientific_Racism_and_Civilising_Mission",
            "Eurocentric_Bias_and_Indigenous_Knowledge",
            "Colonial_Legacies_and_Design_Bias"
        ]
    },
    {
        "id": "4.2.2",
        "marker": "Then, 4.2.2 Juxtaposing Images and Critical Inquiry [40mins]: <!-- ACTIVITY ‚Äî Colonial Impact Reflection (Braf + OpS compliant, inline-only) -->",
        "filename": "4.2.2_Juxtaposing_Images_and_Critical_Inquiry.html",
        "is_book": False
    },
    {
        "id": "4.3.1",
        "marker": "4.3.1 Engineering for Racial Equity [40mins], which consists of three chapters;",
        "base_filename": "4.3.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Educational_Pipeline_and_Workplace_Barriers",
            "Design_Bias_and_Human_Centered_Design",
            "Geopolitics_Resource_Extraction_and_Equity"
        ]
    },
    {
        "id": "4.3.2",
        "marker": "Then, 4.3.2 Redesigning for Equity (HCD) [20mins]:",
        "filename": "4.3.2_Redesigning_for_Equity_HCD.html",
        "is_book": False
    },
    {
        "id": "4.3.3",
        "marker": "Then, 4.3.3 Submitting a Redesign for Equity [60mins]:",
        "filename": "4.3.3_Submitting_a_Redesign_for_Equity.html",
        "is_book": False
    },
    {
        "id": "4.4.1",
        "marker": "4.4.1 Addressing Racial Bias through Policy [40mins], which consists of three chapters;",
        "base_filename": "4.4.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "AI_Bias_Overview",
            "Environmental_Racism",
            "Systemic_Racism_and_Health_Inequity"
        ]
    },
    {
        "id": "4.4.2",
        "marker": "Then, 4.4.2 Deconstructing Bias and Proposing Interventions [60mins]:",
        "filename": "4.4.2_Deconstructing_Bias_and_Proposing_Interventions.html",
        "is_book": False
    },
    {
        "id": "4.5.1",
        "marker": "4.5.1 Critical Race Theory as a Framework for Understanding and Action; Decolonizing STEM Curricula and Practice [30mins], which consists of three chapters;",
        "base_filename": "4.5.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Critical_Race_Theory_as_a_Framework",
            "Decolonising_Science_and_STEM_Curricula",
            "Principles_and_Practices"
        ]
    },
    {
        "id": "4.5.2",
        "marker": "next is 4.5.2 Equity Action Memo [60mins]:<!-- ACTIVITY: Individual Equity Action Memo (Braf + OpS compliant) -->",
        "filename": "4.5.2_Equity_Action_Memo.html",
        "is_book": False
    },
    {
        "id": "4.6.1",
        "marker": "and finally, 4.6.1 Week 4 Conclusions: Race and Racism in Science and Policy [10mins]: <!-- WEEK CONCLUSION: Race and Racism in Science and Policy (Braf + OpS compliant) -->",
        "filename": "4.6.1_Week_4_Conclusions.html",
        "is_book": False
    }
]

# Find start indices
for i, section in enumerate(sections):
    start_idx = content.find(section["marker"])
    if start_idx == -1:
        print(f"Error: Marker not found for {section['id']}")
        continue
    
    # The content starts AFTER the marker line. 
    # We can find the end of the marker line.
    marker_end_idx = start_idx + len(section["marker"])
    
    # Find the start of the NEXT section to define the end of this one
    if i < len(sections) - 1:
        next_marker = sections[i+1]["marker"]
        end_idx = content.find(next_marker)
        if end_idx == -1:
             print(f"Error: Next marker not found for section after {section['id']}")
             end_idx = len(content)
    else:
        end_idx = len(content)
    
    section_content = content[marker_end_idx:end_idx].strip()
    
    if section["is_book"]:
        # Split by chapters
        # Chapters look like "Chapter X: <!-- ... -->" or "Chapter X: <div..."
        # We can regex split, but we need to keep the content associated with each.
        
        # Let's find all "Chapter \d+:" occurrences
        chapter_pattern = re.compile(r'(Chapter \d+:.*)')
        parts = chapter_pattern.split(section_content)
        
        # parts[0] might be empty or whitespace if the first chapter starts immediately
        # parts[1] is "Chapter 1: ...", parts[2] is content of ch1, parts[3] is "Chapter 2: ...", etc.
        
        current_chapter_idx = 0
        
        # Skip preamble if any (usually empty or just whitespace)
        start_k = 1 if not parts[0].strip() else 0
        
        # If the split didn't work as expected (e.g. no chapters found), warn
        if len(parts) < 2:
             print(f"Warning: No chapters found in {section['id']}")
             # Fallback: write entire content to one file if chapters not found?
             # Or just skip.
             continue

        for k in range(1, len(parts), 2):
            if current_chapter_idx >= len(section["chapter_names"]):
                break
                
            header = parts[k] # e.g. "Chapter 1: <!-- ... -->"
            body = parts[k+1] if k+1 < len(parts) else ""
            
            # Clean header: remove "Chapter \d+:"
            clean_header = re.sub(r'Chapter \d+:', '', header).strip()
            
            full_chapter_content = clean_header + "\n" + body
            full_chapter_content = full_chapter_content.strip()
            
            chapter_name = section["chapter_names"][current_chapter_idx]
            fname = f"{section['id']}_Chapter_{current_chapter_idx+1}_{chapter_name}.html"
            
            with open(os.path.join(output_dir, fname), 'w', encoding='utf-8') as out_f:
                out_f.write(full_chapter_content)
            
            print(f"Created {fname}")
            current_chapter_idx += 1
            
    else:
        # Single file
        with open(os.path.join(output_dir, section["filename"]), 'w', encoding='utf-8') as out_f:
            out_f.write(section_content)
        print(f"Created {section['filename']}")

print("Processing complete.")
ù=*cascade082@file:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/process_week_4.py