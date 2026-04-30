/**
 * BoomX translation dictionary.
 * Admin-created content (event.title, event.description, payment_note, item.description, etc.)
 * is NOT translated here — it is displayed as originally entered.
 * Brand terms BoomX, BX, QR, Check-in, Run are kept unchanged.
 */

export const translations = {
  en: {
    // ── Bottom Navigation ──
    nav_home:     'Home',
    nav_train:    'Train',
    nav_feed:     'Feed',
    nav_events:   'Events',
    nav_profile:  'Profile',

    // ── Common actions ──
    btn_save:       'Save',
    btn_cancel:     'Cancel',
    btn_confirm:    'Confirm',
    btn_close:      'Close',
    btn_submit:     'Submit',
    btn_register:   'Register',
    btn_back:       'Back',
    btn_done:       'Done',
    btn_edit:       'Edit',
    btn_delete:     'Delete',
    btn_share:      'Share',
    btn_copy:       'Copy',
    btn_copied:     'Copied!',
    btn_sign_in:    'Sign In',
    btn_log_out:    'Log Out',

    // ── Profile ──
    profile_title:        'Profile',
    profile_following:    'Following',
    profile_followers:    'Followers',
    profile_performance:  'Performance',
    profile_distance:     'Distance',
    profile_runs:         'Runs',
    profile_avg_pace:     'Avg Pace',
    profile_streak:       'Streak',
    profile_total_time:   'Total Time',
    profile_calories:     'Calories',
    profile_game:         'Game',
    profile_coin_balance: 'Coin Balance',
    profile_achievements: 'Achievements',
    profile_language:     'Language',
    profile_level:        'Level',
    profile_settings:     'Settings',
    profile_edit_bio:     'Edit Bio',
    profile_save_bio:     'Save',
    profile_display_name: 'Display Name',

    // ── Events ──
    event_register:       'Register Now',
    event_registered:     'Registered',
    event_my_tickets:     'My Tickets',
    event_details:        'Event Details',
    event_date:           'Date',
    event_location:       'Location',
    event_organizer:      'Organizer',
    event_category:       'Category',
    event_categories:     'Categories',
    event_status_open:    'Open',
    event_status_closed:  'Closed',
    event_status_full:    'Full',
    event_spots_left:     'spots left',
    event_free:           'Free',
    event_share:          'Share Event',
    event_save_qr:        'Save QR',
    event_copy_link:      'Copy Link',

    // ── Ticket ──
    ticket_title:         'BOOMX TICKET',
    ticket_bib:           'Bib Number',
    ticket_your_items:    'Your Items',
    ticket_event_details: 'Event Details',
    ticket_status:        'Status',
    ticket_participant:   'Participant',
    ticket_checkin:       'Check-In',
    ticket_checked_in:    '✓ Checked In',
    ticket_no_qr:         'NO QR',

    // ── Registration ──
    reg_title:            'Registration',
    reg_included_items:   'Included Items',
    reg_choose_required:  'Choose required',
    reg_included:         'Included',
    reg_register_as:      'Registering as',
    reg_success:          'Registration successful!',
    reg_already:          'Already registered',
    reg_full:             'Category is full',

    // ── Registration status ──
    status_pending:       'Pending',
    status_confirmed:     'Confirmed',
    status_cancelled:     'Cancelled',
    status_rejected:      'Rejected',

    // ── Payment ──
    payment_title:        'Payment',
    payment_required:     'Payment Required',
    payment_amount:       'Amount Due',
    payment_method_bank:  'Bank Transfer',
    payment_method_qr:    'QR Scan',
    payment_upload_slip:  'Upload Payment Slip',
    payment_submit:       'Submit Payment',
    payment_resubmit:     'Resubmit Payment',
    payment_note_label:   'Note (optional)',
    payment_awaiting:     'Awaiting Payment Approval',
    payment_approved:     'Payment Approved',
    payment_not_required: 'No Payment Required',
    payment_needs_attn:   'Needs Attention',
    payment_refunded:     'Refunded',
    payment_tap_qr:       '👁 Tap to view full QR',
    payment_scan_pay:     'Scan and pay',

    // ── Check-in ──
    checkin_scanner:      'Check-In Scanner',
    checkin_scan_qr:      'Scan QR with Camera',
    checkin_search_hint:  'Bib, name, or email…',
    checkin_find:         'Find',
    checkin_confirm:      'Confirm Check-In',
    checkin_complete:     'Check-In Complete!',
    checkin_already:      'Already Checked In',
    checkin_not_found:    'No Participant Found',
    checkin_scan_next:    'Scan Next Runner',

    // ── Error / empty states ──
    error_generic:        'Something went wrong. Please try again.',
    empty_no_events:      'No events yet',
    empty_no_tickets:     'No tickets yet',
    empty_no_items:       'No items',
  },

  th: {
    // ── Bottom Navigation ──
    nav_home:     'หน้าหลัก',
    nav_train:    'เทรน',
    nav_feed:     'ฟีด',
    nav_events:   'อีเวนต์',
    nav_profile:  'โปรไฟล์',

    // ── Common actions ──
    btn_save:       'บันทึก',
    btn_cancel:     'ยกเลิก',
    btn_confirm:    'ยืนยัน',
    btn_close:      'ปิด',
    btn_submit:     'ส่ง',
    btn_register:   'สมัคร',
    btn_back:       'ย้อนกลับ',
    btn_done:       'เสร็จสิ้น',
    btn_edit:       'แก้ไข',
    btn_delete:     'ลบ',
    btn_share:      'แชร์',
    btn_copy:       'คัดลอก',
    btn_copied:     'คัดลอกแล้ว!',
    btn_sign_in:    'เข้าสู่ระบบ',
    btn_log_out:    'ออกจากระบบ',

    // ── Profile ──
    profile_title:        'โปรไฟล์',
    profile_following:    'กำลังติดตาม',
    profile_followers:    'ผู้ติดตาม',
    profile_performance:  'ผลการวิ่ง',
    profile_distance:     'ระยะทาง',
    profile_runs:         'จำนวนครั้ง',
    profile_avg_pace:     'เพซเฉลี่ย',
    profile_streak:       'สตรีค',
    profile_total_time:   'เวลารวม',
    profile_calories:     'แคลอรี่',
    profile_game:         'เกม',
    profile_coin_balance: 'ยอดคอยน์',
    profile_achievements: 'ความสำเร็จ',
    profile_language:     'ภาษา',
    profile_level:        'เลเวล',
    profile_settings:     'ตั้งค่า',
    profile_edit_bio:     'แก้ไขโปรไฟล์',
    profile_save_bio:     'บันทึก',
    profile_display_name: 'ชื่อที่แสดง',

    // ── Events ──
    event_register:       'สมัครเลย',
    event_registered:     'สมัครแล้ว',
    event_my_tickets:     'ตั๋วของฉัน',
    event_details:        'รายละเอียดอีเวนต์',
    event_date:           'วันที่',
    event_location:       'สถานที่',
    event_organizer:      'ผู้จัด',
    event_category:       'ประเภท',
    event_categories:     'ประเภทการแข่งขัน',
    event_status_open:    'เปิดรับสมัคร',
    event_status_closed:  'ปิดรับสมัคร',
    event_status_full:    'เต็มแล้ว',
    event_spots_left:     'ที่นั่งที่เหลือ',
    event_free:           'ฟรี',
    event_share:          'แชร์อีเวนต์',
    event_save_qr:        'บันทึก QR',
    event_copy_link:      'คัดลอกลิงก์',

    // ── Ticket ──
    ticket_title:         'ตั๋ว BOOMX',
    ticket_bib:           'หมายเลขบิบ',
    ticket_your_items:    'ของที่ได้รับ',
    ticket_event_details: 'รายละเอียดอีเวนต์',
    ticket_status:        'สถานะ',
    ticket_participant:   'ข้อมูลผู้เข้าร่วม',
    ticket_checkin:       'Check-In',
    ticket_checked_in:    '✓ Check-In แล้ว',
    ticket_no_qr:         'ไม่มี QR',

    // ── Registration ──
    reg_title:            'การสมัคร',
    reg_included_items:   'ของที่ได้รับ',
    reg_choose_required:  'กรุณาเลือก',
    reg_included:         'รวมอยู่แล้ว',
    reg_register_as:      'สมัครในนาม',
    reg_success:          'สมัครสำเร็จ!',
    reg_already:          'สมัครไปแล้ว',
    reg_full:             'ประเภทนี้เต็มแล้ว',

    // ── Registration status ──
    status_pending:       'รอดำเนินการ',
    status_confirmed:     'ยืนยันแล้ว',
    status_cancelled:     'ยกเลิกแล้ว',
    status_rejected:      'ถูกปฏิเสธ',

    // ── Payment ──
    payment_title:        'การชำระเงิน',
    payment_required:     'ต้องชำระเงิน',
    payment_amount:       'ยอดที่ต้องชำระ',
    payment_method_bank:  'โอนเงินผ่านธนาคาร',
    payment_method_qr:    'สแกน QR',
    payment_upload_slip:  'แนบสลิปการชำระเงิน',
    payment_submit:       'ส่งหลักฐานการชำระเงิน',
    payment_resubmit:     'ส่งหลักฐานใหม่',
    payment_note_label:   'หมายเหตุ (ไม่บังคับ)',
    payment_awaiting:     'รอตรวจสอบการชำระเงิน',
    payment_approved:     'ชำระเงินแล้ว',
    payment_not_required: 'ไม่ต้องชำระเงิน',
    payment_needs_attn:   'ต้องดำเนินการเพิ่มเติม',
    payment_refunded:     'คืนเงินแล้ว',
    payment_tap_qr:       '👁 แตะเพื่อดู QR แบบเต็ม',
    payment_scan_pay:     'สแกนและชำระเงิน',

    // ── Check-in ──
    checkin_scanner:      'สแกนเนอร์ Check-In',
    checkin_scan_qr:      'สแกน QR ด้วยกล้อง',
    checkin_search_hint:  'บิบ, ชื่อ, หรืออีเมล…',
    checkin_find:         'ค้นหา',
    checkin_confirm:      'ยืนยัน Check-In',
    checkin_complete:     'Check-In สำเร็จ!',
    checkin_already:      'Check-In ไปแล้ว',
    checkin_not_found:    'ไม่พบผู้เข้าร่วม',
    checkin_scan_next:    'สแกนคนต่อไป',

    // ── Error / empty states ──
    error_generic:        'เกิดข้อผิดพลาด กรุณาลองใหม่',
    empty_no_events:      'ยังไม่มีอีเวนต์',
    empty_no_tickets:     'ยังไม่มีตั๋ว',
    empty_no_items:       'ไม่มีรายการ',
  },
};

/**
 * Returns translation for a key. Falls back to the key itself if not found.
 * @param {string} lang - 'en' | 'th'
 * @param {string} key
 * @returns {string}
 */
export function translate(lang, key) {
  return translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
}