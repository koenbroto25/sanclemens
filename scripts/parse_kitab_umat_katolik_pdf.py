import PyPDF2
import re
import json
import os

def clean_text(text):
    # Remove common PDF artifacts like page numbers, headers, and footers
    # More aggressive removal of header/footer lines
    text = re.sub(r'Halaman Depan DC\.indd\s+\d+.*?(AM|PM)', '', text, flags=re.IGNORECASE)
    # Remove page numbers which often appear as standalone digits or with book names in headers/footers
    text = re.sub(r'\s+\d+\s+(KEJADIAN|KELUARAN|IMAMAT|BILANGAN|ULANGAN|YOSUA|HAKIM-HAKIM|RUT|SAMUEL|RAJA-RAJA|TAWARIKH|EZRA|NEHEMIA|ESTER|AYUB|MAZMUR|AMSAL|PENGKHOTBAH|KIDUNG AGUNG|YESAYA|YEREMIA|RATAPAN|YEHEZKIEL|DANIEL|HOSEA|YOEL|AMOS|OBAJA|YUNUS|MIKHA|NAHUM|HABAKUK|ZEFANYA|HAGAI|ZAKHARIA|MALEAKHI|TOBIT|YUDIT|TAMBAHAN-TAMBAHAN PADA KITAB ESTER|KEBIJAKSANAAN SALOMO|YESUS BIN SIRAKH|INJIL MATIUS|INJIL MARKUS|INJIL LUKAS|INJIL YOHANES|KISAH PARA RASUL|SURAT PAULUS KEPADA JEMAAT DI ROMA|SURAT PAULUS YANG PERTAMA KEPADA JEMAAT DI KORINTUS|SURAT PAULUS YANG KEDUA KEPADA JEMAAT DI KORINTUS|SURAT PAULUS KEPADA JEMAAT DI GALATIA|SURAT PAULUS KEPADA JEMAAT DI EFESUS|SURAT PAULUS KEPADA JEMAAT DI FILIPI|SURAT PAULUS KEPADA JEMAAT DI KOLOSE|SURAT PAULUS YANG PERTAMA KEPADA JEMAAT DI TESALONIKA|SURAT PAULUS YANG KEDUA KEPADA JEMAAT DI TESALONIKA|SURAT PAULUS YANG PERTAMA KEPADA TIMOTIUS|SURAT PAULUS YANG KEDUA KEPADA TIMOTIUS|SURAT PAULUS KEPADA TITUS|SURAT PAULUS KEPADA FILEMON|SURAT KEPADA ORANG IBRANI|SURAT YAKOBUS|SURAT PETRUS YANG PERTAMA|SURAT PETRUS YANG KEDUA|SURAT YOHANES YANG PERTAMA|SURAT YOHANES YANG KEDUA|SURAT YOHANES YANG KETIGA|SURAT YUDAS|WAHYU KEPADA YOHANES)\s+\d+(,\d+)?(\s+-\s+\d+)?','',text, flags=re.IGNORECASE)
    text = re.sub(r'(\d+)\s+(KEJADIAN|KELUARAN|IMAMAT|BILANGAN|ULANGAN|YOSUA|HAKIM-HAKIM|RUT|SAMUEL|RAJA-RAJA|TAWARIKH|EZRA|NEHEMIA|ESTER|AYUB|MAZMUR|AMSAL|PENGKHOTBAH|KIDUNG AGUNG|YESAYA|YEREMIA|RATAPAN|YEHEZKIEL|DANIEL|HOSEA|YOEL|AMOS|OBAJA|YUNUS|MIKHA|NAHUM|HABAKUK|ZEFANYA|HAGAI|ZAKHARIA|MALEAKHI|TOBIT|YUDIT|TAMBAHAN-TAMBAHAN PADA KITAB ESTER|KEBIJAKSANAAN SALOMO|YESUS BIN SIRAKH|INJIL MATIUS|INJIL MARKUS|INJIL LUKAS|INJIL YOHANES|KISAH PARA RASUL|SURAT PAULUS KEPADA JEMAAT DI ROMA|SURAT PAULUS YANG PERTAMA KEPADA JEMAAT DI KORINTUS|SURAT PAULUS YANG KEDUA KEPADA JEMAAT DI KORINTUS|SURAT PAULUS KEPADA JEMAAT DI GALATIA|SURAT PAULUS KEPADA JEMAAT DI EFESUS|SURAT PAULUS KEPADA JEMAAT DI FILIPI|SURAT PAULUS KEPADA JEMAAT DI FILIPI|SURAT PAULUS KEPADA JEMAAT DI KOLOSE|SURAT PAULUS YANG PERTAMA KEPADA JEMAAT DI TESALONIKA|SURAT PAULUS YANG KEDUA KEPADA JEMAAT DI TESALONIKA|SURAT PAULUS YANG PERTAMA KEPADA TIMOTIUS|SURAT PAULUS YANG KEDUA KEPADA TIMOTIUS|SURAT PAULUS KEPADA TITUS|SURAT PAULUS KEPADA FILEMON|SURAT KEPADA ORANG IBRANI|SURAT YAKOBUS|SURAT PETRUS YANG PERTAMA|SURAT PETRUS YANG KEDUA|SURAT YOHANES YANG PERTAMA|SURAT YOHANES YANG KEDUA|SURAT YOHANES YANG KETIGA|SURAT YUDAS|WAHYU KEPADA YOHANES)\s+\d+','',text, flags=re.IGNORECASE)
    
    # Remove table of contents entries that are now explicit in the user message
    # These patterns are observed in the initial PDF content (lines 67-146)
    toc_patterns = [
        r'Kejadian\s+\.+\s+\d+', r'Keluaran\s+\.+\s+\d+', r'Imamat\s+\.+\s+\d+', r'Bilangan\s+\.+\s+\d+',
        r'Ulangan\s+\.+\s+\d+', r'Yosua\s+\.+\s+\d+', r'Hakim-hakim\s+\.+\s+\d+', r'Rut\s+\.+\s+\d+',
        r'1\s+Samuel\s+\.+\s+\d+', r'2\s+Samuel\s+\.+\s+\d+', r'1\s+Raja-raja\s+\.+\s+\d+',
        r'2\s+Raja-raja\s+\.+\s+\d+', r'1\s+Tawarikh\s+\.+\s+\d+', r'2\s+Tawarikh\s+\.+\s+\d+',
        r'Ezra\s+\.+\s+\d+', r'Nehemia\s+\.+\s+\d+', r'Ester\s+\.+\s+\d+', r'Ayub\s+\.+\s+\d+',
        r'Mazmur\s+\.+\s+\d+', r'Amsal\s+\.+\s+\d+', r'Pengkhotbah\s+\.+\s+\d+', r'Kidung\s+Agung\s+\.+\s+\d+',
        r'Yesaya\s+\.+\s+\d+', r'Yeremia\s+\.+\s+\d+', r'Ratapan\s+\.+\s+\d+', r'Yehezkiel\s+\.+\s+\d+',
        r'Daniel\s+\.+\s+\d+', r'Hosea\s+\.+\s+\d+', r'Yoël\s+\.+\s+\d+', r'Amos\s+\.+\s+\d+',
        r'Obaja\s+\.+\s+\d+', r'Yunus\s+\.+\s+\d+', r'Mikha\s+\.+\s+\d+', r'Nahum\s+\.+\s+\d+',
        r'Habakuk\s+\.+\s+\d+', r'Zefanya\s+\.+\s+\d+', r'Hagai\s+\.+\s+\d+', r'Zakharia\s+\.+\s+\d+',
        r'Maleakhi\s+\.+\s+\d+',
        r'Tobit\s+\.+\s+\d+', r'Yudit\s+\.+\s+\d+', r'Tambahan-tambahan pada Kitab Ester\s+\.+\s+\d+',
        r'Kebijaksanaan Salomo\s+\.+\s+\d+', r'Yesus bin Sirakh\s+\.+\s+\d+', r'Barukh dan Surat Nabi Yeremia\s+\.+\s+\d+',
        r'Tambahan-tambahan pada Kitab Daniel\s+\.+\s+\d+', r'Kitab Makabe yang Pertama\s+\.+\s+\d+',
        r'Kitab Makabe yang Kedua\s+\.+\s+\d+',
        r'Injil Matius\s+\.+\s+\d+', r'Injil Markus\s+\.+\s+\d+', r'Injil Lukas\s+\.+\s+\d+', r'Injil Yohanes\s+\.+\s+\d+',
        r'Kisah Para Rasul\s+\.+\s+\d+', r'Surat Paulus kepada Jemaat di Roma\s+\.+\s+\d+',
        r'Surat Paulus yang Pertama kepada Jemaat di Korintus\s+\.+\s+\d+',
        r'Surat Paulus yang Kedua kepada Jemaat di Korintus\s+\.+\s+\d+',
        r'Surat Paulus kepada Jemaat di Galatia\s+\.+\s+\d+', r'Surat Paulus kepada Jemaat di Efesus\s+\.+\s+\d+',
        r'Surat Paulus kepada Jemaat di Filipi\s+\.+\s+\d+', r'Surat Paulus kepada Jemaat di Kolose\s+\.+\s+\d+',
        r'Surat Paulus yang Pertama kepada Jemaat di Tesalonika\s+\.+\s+\d+',
        r'Surat Paulus yang Kedua kepada Jemaat di Tesalonika\s+\.+\s+\d+',
        r'Surat Paulus yang Pertama kepada Timotius\s+\.+\s+\d+',
        r'Surat Paulus yang Kedua kepada Timotius\s+\.+\s+\d+', r'Surat Paulus kepada Titus\s+\.+\s+\d+',
        r'Surat Paulus kepada Filemon\s+\.+\s+\d+', r'Surat kepada orang Ibrani\s+\.+\s+\d+',
        r'Surat Yakobus\s+\.+\s+\d+', r'Surat Petrus yang Pertama\s+\.+\s+\d+',
        r'Surat Petrus yang Kedua\s+\.+\s+\d+', r'Surat Yohanes yang Pertama\s+\.+\s+\d+',
        r'Surat Yohanes yang Kedua\s+\.+\s+\d+', r'Surat Yohanes yang Ketiga\s+\.+\s+\d+',
        r'Surat Yudas\s+\.+\s+\d+', r'Wahyu kepada Yohanes\s+\.+\s+\d+',
        r'Kamus Alkitab\s+\.+\s+\d+', r'Bagan Sejarah\s+\.+\s+\d+', r'Peta\s+\.+\s+\d+'
    ]
    for pattern in toc_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Remove hyphenation at line breaks
    text = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', text)
    # Remove remaining newlines and excessive spaces
    text = text.replace('\n', ' ').strip()
    text = re.sub(r'\s+', ' ', text)
    return text

def parse_pdf_to_json(pdf_path, output_json_path):
    bible_data = []
    current_book_obj = None
    current_chapter_obj = None

    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)

        book_titles = [
            "Kejadian", "Keluaran", "Imamat", "Bilangan", "Ulangan", "Yosua", "Hakim-hakim", "Rut",
            "1 Samuel", "2 Samuel", "1 Raja-raja", "2 Raja-raja", "1 Tawarikh", "2 Tawarikh", "Ezra", "Nehemia",
            "Ester", "Ayub", "Mazmur", "Amsal", "Pengkhotbah", "Kidung Agung", "Yesaya", "Yeremia", "Ratapan",
            "Yehezkiel", "Daniel", "Hosea", "Yoël", "Amos", "Obaja", "Yunus", "Mikha", "Nahum", "Habakuk",
            "Zefanya", "Hagai", "Zakharia", "Maleakhi",
            # Deuterokanonika
            "Tobit", "Yudit", "Tambahan-tambahan pada Kitab Ester", "Kebijaksanaan Salomo", "Yesus bin Sirakh",
            "Barukh dan Surat Nabi Yeremia", "Tambahan-tambahan pada Kitab Daniel", "1 Makabe", "2 Makabe",
            # Perjanjian Baru
            "Injil Matius", "Injil Markus", "Injil Lukas", "Injil Yohanes", "Kisah Para Rasul",
            "Surat Paulus kepada Jemaat di Roma", "Surat Paulus yang Pertama kepada Jemaat di Korintus",
            "Surat Paulus yang Kedua kepada Jemaat di Korintus", "Surat Paulus kepada Jemaat di Galatia",
            "Surat Paulus kepada Jemaat di Efesus", "Surat Paulus kepada Jemaat di Filipi",
            "Surat Paulus kepada Jemaat di Kolose", "Surat Paulus yang Pertama kepada Jemaat di Tesalonika",
            "Surat Paulus yang Kedua kepada Jemaat di Tesalonika",
            "Surat Paulus yang Pertama kepada Timotius", "Surat Paulus yang Kedua kepada Timotius",
            "Surat Paulus kepada Titus", "Surat Paulus kepada Filemon", "Surat kepada orang Ibrani",
            "Surat Yakobus", "Surat Petrus yang Pertama", "Surat Petrus yang Kedua",
            "Surat Yohanes yang Pertama", "Surat Yohanes yang Kedua", "Surat Yohanes yang Ketiga",
            "Surat Yudas", "Wahyu kepada Yohanes"
        ]

        full_text = ""
        for i in range(len(reader.pages)):
            page = reader.pages[i]
            full_text += page.extract_text() + "\n" # Add newline to separate page content

        cleaned_full_text = clean_text(full_text)

        # Regex to find book titles. Look for common patterns like "BOOK_NAME Chapter_Number" or just "BOOK_NAME" at the start of a logical block.
        # Make sure to handle "1 Samuel", "2 Samuel" etc.
        book_pattern = r'(?:^|\s)(?:(1|2)\s)?(' + '|'.join(re.escape(bt) for bt in book_titles) + r')(?=\s+\d+|$)'
        
        # Split the entire cleaned text by book titles to process each book individually
        book_splits = re.split(book_pattern, cleaned_full_text, flags=re.IGNORECASE)
        
        # The first element is usually empty or irrelevant text before the first book.
        # Iterate through the splits to find actual books.
        # This will be tricky because re.split with groups includes the matched groups in the result.
        # So it will be: [preamble, (1|2)?, BookName, content_after_book, (1|2)?, BookName, content_after_book, ...]
        
        i = 0
        if book_splits and len(book_splits) > 1:
            # Skip initial preamble if any
            if book_splits[0].strip() == '':
                i = 1 # Start checking from the first potential book part
            
            while i < len(book_splits):
                prefix = book_splits[i] if book_splits[i] else '' # 1 or 2 for numbered books
                book_name_raw = book_splits[i+1].strip() if i+1 < len(book_splits) else ''
                book_content_raw = book_splits[i+2].strip() if i+2 < len(book_splits) else ''

                if book_name_raw:
                    full_book_name = (prefix + ' ' + book_name_raw).strip() if prefix else book_name_raw
                    
                    # Fuzzy match book name to actual list
                    matched_book = None
                    for bt in book_titles:
                        if bt.lower() == full_book_name.lower() or (bt.startswith(prefix) and bt[len(prefix):].strip().lower() == book_name_raw.lower()):
                            matched_book = bt
                            break

                    if matched_book:
                        print(f"--- Found Book: {matched_book} ---")
                        current_book_obj = {"book": matched_book, "chapters": []}
                        bible_data.append(current_book_obj)
                        current_chapter_obj = None # Reset chapter for new book

                        # Now parse content of this book for chapters and verses
                        # Split by chapter numbers. Chapter numbers are usually large and stand alone or start a paragraph.
                        chapter_splits = re.split(r'\b(\d+)\s+', book_content_raw)
                        
                        chapter_text_index = 0
                        if chapter_splits[0].strip() == '': # Skip empty part before first chapter number
                            chapter_text_index = 1

                        while chapter_text_index < len(chapter_splits):
                            try:
                                chapter_num_str = chapter_splits[chapter_text_index].strip()
                                chapter_num = int(chapter_num_str)
                                chapter_content = chapter_splits[chapter_text_index + 1].strip() if chapter_text_index + 1 < len(chapter_splits) else ""

                                # Ensure chapter is sequential and belongs to the current book
                                if current_book_obj and (current_chapter_obj is None or chapter_num > current_chapter_obj['chapter']):
                                    current_chapter_obj = {"chapter": chapter_num, "verses": []}
                                    current_book_obj["chapters"].append(current_chapter_obj)
                                    # print(f"  Found Chapter: {chapter_num}")
                                
                                if current_chapter_obj:
                                    # Regex to split content into verses, handling leading text as verse 1 if no '1' is present
                                    # Matches 1 or more digits, followed by text until another digit or end of string
                                    verse_matches = re.findall(r'(\d+)\s+([^0-9]+(?:\s*(?=\d+\s+)|$))', chapter_content)
                                    
                                    processed_verse_nums = set()
                                    if not verse_matches and chapter_content:
                                        # If no explicit verse numbers found, treat as single verse 1
                                        if not any(v['verse'] == 1 for v in current_chapter_obj['verses']):
                                            current_chapter_obj['verses'].append({"verse": 1, "text": chapter_content.strip()})
                                            processed_verse_nums.add(1)

                                    else:
                                        last_verse_num = 0
                                        # Handle potential verse 1 that might not be explicitly numbered '1' at the start
                                        first_verse_text_match = re.match(r'^(.*?)\s*(\d+)\s+', chapter_content)
                                        if first_verse_text_match:
                                            potential_verse_1_text = first_verse_text_match.group(1).strip()
                                            if potential_verse_1_text and not any(v['verse'] == 1 for v in current_chapter_obj['verses']):
                                                current_chapter_obj['verses'].append({"verse": 1, "text": potential_verse_1_text})
                                                processed_verse_nums.add(1)
                                                
                                            # Update chapter_content to remove what was potentially parsed as verse 1
                                            chapter_content = chapter_content[len(first_verse_text_match.group(1)) + len(first_verse_text_match.group(2)) + 2:].strip()


                                        for v_match in verse_matches:
                                            verse_num = int(v_match[0])
                                            verse_text = v_match[1].strip()
                                            
                                            if verse_num not in processed_verse_nums:
                                                current_chapter_obj['verses'].append({"verse": verse_num, "text": verse_text})
                                                processed_verse_nums.add(verse_num)
                                                last_verse_num = verse_num
                                            else:
                                                # Append to existing verse if split
                                                for v in current_chapter_obj['verses']:
                                                    if v['verse'] == verse_num:
                                                        v['text'] += " " + verse_text
                                                        break
                                        
                                        # Add remaining content as part of the last verse if any
                                        if last_verse_num > 0 and chapter_content:
                                            remaining_after_last_verse = chapter_content.split(str(last_verse_num), 1)[-1].strip()
                                            if remaining_after_last_verse:
                                                for v in current_chapter_obj['verses']:
                                                    if v['verse'] == last_verse_num:
                                                        v['text'] += " " + remaining_after_last_verse
                                                        break
                                
                                chapter_text_index += 2
                            except (ValueError, IndexError) as e:
                                print(f"Warning: Could not parse chapter/verse in section: '{chapter_splits[chapter_text_index:chapter_text_index+2]}'. Error: {e}")
                                chapter_text_index += 2 # Skip problematic section
                                continue
                i += 3 # Move to the next potential book
        
    # Final cleanup and sorting
    final_bible_data = []
    for book in bible_data:
        if book['chapters']:
            cleaned_chapters = []
            for chapter in book['chapters']:
                if chapter['verses']:
                    chapter['verses'] = sorted(chapter['verses'], key=lambda x: x['verse'])
                    cleaned_chapters.append(chapter)
            
            if cleaned_chapters:
                book['chapters'] = sorted(cleaned_chapters, key=lambda x: x['chapter'])
                final_bible_data.append(book)

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(final_bible_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully parsed PDF and saved to {output_json_path}")


if __name__ == "__main__":
    pdf_file = "data/kitab_umat_katolik.pdf"
    json_output_file = "data/bible nabre/nabre_id_official.json"
    parse_pdf_to_json(pdf_file, json_output_file)